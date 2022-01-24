import { WalletNotConnectedError } from '@solana/wallet-adapter-base';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, SystemProgram, Transaction, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { useState } from 'react';
import { CLAIM_TOKEN_PROGRAM_SCHEMA } from '../../util/schema';
import { DistributorState } from '../../util/state';
import { deserializeUnchecked } from 'borsh';
import { useSelector } from 'react-redux';
import { claimTokens } from '../../util/claimTokens';
import { findAssociatedTokenAddress } from '../../util/findAssociatedTokenAddress';

export const ClaimTokens = () => {
    const { connection } = useConnection();
    const { publicKey, sendTransaction } = useWallet();

    const programId = useSelector(state => new PublicKey(state.programId));

    const [formData, updateFormData] = useState({
        distributorStateAccount: null,
        distributorRewardAccount: null,
        rewardMintAccount: null,
        claimantNFTAccount: null,
        NFTMintAccount: null
    });

    const updateForm = (e) => {
        const form = {...formData};
        const field = e.target.name;
        form[field] = e.target.value;
        updateFormData(form);
    }

    const onClick = async () => {
        try {
            if (!publicKey) throw new WalletNotConnectedError();

            const transaction = new Transaction();

            // const LAMPORTS_PER_TOKEN = LAMPORTS_PER_SOL;

            // ACCOUNTS
            const initializerAccount = publicKey;
            const distributorStateAccount = new PublicKey(formData.distributorStateAccount);
            const distributorRewardAccount = new PublicKey(formData.distributorRewardAccount);
            const rewardMintAccount = new PublicKey(formData.rewardMintAccount);
            const claimantNFTAccount = new PublicKey(formData.claimantNFTAccount);
            const NFTMintAccount = new PublicKey(formData.NFTMintAccount);

            // get claimant reward account - associated account of reward mint 
            const claimantRewardAccount = await findAssociatedTokenAddress(publicKey, rewardMintAccount);

            // get pda account = "distributor" + distributor state pubkey
            const PDA = await PublicKey.findProgramAddress([Buffer.from("distributor"), distributorStateAccount.toBuffer()], programId);

            // get account seed = nft mint pubkey as string - write receivedTokens = True to this account
            const proofOfReceiptPDA = await PublicKey.findProgramAddress([Buffer.from("claimed"), NFTMintAccount.toBuffer()], programId);

            // get metadata account derived from NFTMintAccount
            const metadataProgramId = new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s");
            
            const NFTMetadataAccount = await PublicKey.findProgramAddress([Buffer.from("metadata"), metadataProgramId.toBuffer(), NFTMintAccount.toBuffer()], metadataProgramId);

            const claimTokensIx = await claimTokens(
                initializerAccount,
                distributorStateAccount,
                distributorRewardAccount,
                claimantRewardAccount,
                PDA[0],
                claimantNFTAccount,
                NFTMetadataAccount[0],
                proofOfReceiptPDA[0],
                programId
            );
            transaction.add(
                claimTokensIx
            );

            let { blockhash } = await connection.getRecentBlockhash();
            transaction.recentBlockhash = blockhash;
            transaction.feePayer = publicKey;

            console.log(transaction);

            const signature = await sendTransaction(transaction, connection);

            console.log(signature);

            await connection.confirmTransaction(signature, 'confirmed');

            const account = await connection.getAccountInfo(distributorStateAccount, 'confirmed');

            const distributorData = deserializeUnchecked(CLAIM_TOKEN_PROGRAM_SCHEMA, DistributorState, account.data);

            const distributorDataNew = {...distributorData};
            distributorDataNew.amountClaimed = distributorData.amountClaimed.toNumber();
            distributorDataNew.rewardAmountPerNft = distributorData.rewardAmountPerNft.toNumber();
            distributorDataNew.rewardAmountTotal = distributorData.rewardAmountTotal.toNumber();

            console.log(distributorDataNew);

        } catch(e) {
            alert(e);
        }
    };

    return (
        <div>
            <h2>Claim Tokens</h2>
            <input type="text" placeholder="Distributor State Account" name="distributorStateAccount" onChange={(e) => updateForm(e)}/> <br/>
            <input type="text" placeholder="Distributor Reward Account" name="distributorRewardAccount" onChange={(e) => updateForm(e)}/> <br/>
            <input type="text" placeholder="Reward Mint Account" name="rewardMintAccount" onChange={(e) => updateForm(e)}/> <br/>
            <input type="text" placeholder="Claimant NFT account" name="claimantNFTAccount" onChange={(e) => updateForm(e)}/> <br/>
            <input type="text" placeholder="NFT mint account" name="NFTMintAccount" onChange={(e) => updateForm(e)}/> <br/>
            <button onClick={onClick} disabled={!publicKey}>
                Claim Tokens
            </button>
        </div>
    );
};
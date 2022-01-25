import { WalletNotConnectedError } from '@solana/wallet-adapter-base';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, SystemProgram, Transaction, SYSVAR_RENT_PUBKEY, TransactionInstruction } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from '@solana/spl-token';
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
        // distributorRewardAccount: null,
        // rewardMintAccount: null,
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

            // get and deserialize distributor state data
            const distributorStateAccountInfo = await connection.getAccountInfo(distributorStateAccount, "confirmed");
            const distributorDataDeserialized = deserializeUnchecked(CLAIM_TOKEN_PROGRAM_SCHEMA, DistributorState, distributorStateAccountInfo.data);

            const distributorRewardAccount = new PublicKey(distributorDataDeserialized.rewardTokenAccount);
            const rewardMintAccount = new PublicKey(distributorDataDeserialized.rewardMint);

            const NFTMintAccount = new PublicKey(formData.NFTMintAccount);
            // get claimant NFT account - associated account of NFT mint
            const claimantNFTAccount = await findAssociatedTokenAddress(publicKey, NFTMintAccount);

            // get claimant reward account - associated account of reward mint 
            const claimantRewardAccount = await findAssociatedTokenAddress(publicKey, rewardMintAccount);
            // check if account exists already, if not create account
            const claimantAssociatedAccount = await connection.getAccountInfo(claimantRewardAccount, "confirmed");
            if (claimantAssociatedAccount === null) {
                const createAssociatedTokenAccountIx = new TransactionInstruction({
                    programId: new PublicKey(ASSOCIATED_TOKEN_PROGRAM_ID),
                    keys: [
                        { pubkey: publicKey, isSigner: true, isWritable: true },
                        { pubkey: claimantRewardAccount, isSigner: false, isWritable: true },
                        { pubkey: publicKey, isSigner: false, isWritable: false },
                        { pubkey: rewardMintAccount, isSigner: false, isWritable: false },
                        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false},
                        { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false},
                        { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false }
                    ],
                    data: []
                });
                transaction.add(createAssociatedTokenAccountIx);
            }

            // get pda account = "distributor" + distributor state pubkey
            const PDA = await PublicKey.findProgramAddress([Buffer.from("distributor"), distributorStateAccount.toBuffer()], programId);

            // get account seed = nft mint pubkey as string - write receivedTokens = True to this account
            const proofOfReceiptPDA = await PublicKey.findProgramAddress([Buffer.from("claimed"), NFTMintAccount.toBuffer(), distributorStateAccount.toBuffer()], programId);

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
            const signature = await sendTransaction(transaction, connection);

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
            <label>Distributor State Account</label> <br/>
            <input type="text" name="distributorStateAccount" onChange={(e) => updateForm(e)}/> <br/>
            {/* <label>Distributor Reward Account</label> <br/>
            <input type="text" name="distributorRewardAccount" onChange={(e) => updateForm(e)}/> <br/>
            <label>Reward Mint Account</label> <br/>
            <input type="text" name="rewardMintAccount" onChange={(e) => updateForm(e)}/> <br/> */}
            <label>NFT Mint Account</label> <br/>
            <input type="text" name="NFTMintAccount" onChange={(e) => updateForm(e)}/> <br/>
            <button onClick={onClick} disabled={!publicKey}>
                Claim Tokens
            </button>
        </div>
    );
};
import { WalletNotConnectedError } from '@solana/wallet-adapter-base';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { Keypair, PublicKey, SystemProgram, Transaction, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { useState } from 'react';
import { Token, TOKEN_PROGRAM_ID, AccountLayout } from '@solana/spl-token';
import { createDistributor} from '../../util/createDistributor';
import { MAX_DISTRIBUTOR_ACCOUNT_LENGTH, DistributorState } from '../../util/state';
import { CLAIM_TOKEN_PROGRAM_SCHEMA } from '../../util/schema';
import { deserializeUnchecked } from 'borsh';
import { useSelector } from 'react-redux';
import { findAssociatedTokenAddress } from '../../util/findAssociatedTokenAddress';

export const CreateDistributor = () => {
    const { connection } = useConnection();
    const { publicKey, sendTransaction } = useWallet();

    const programId = useSelector(state => new PublicKey(state.programId));

    const [formData, updateFormData] = useState({
        rewardTokenMint: null,
        decimals: null,
        numberNFTs: null,
        rewardAmountPerNft: null,
        startTs: null,
        collectionCreatorAccount: null,
        symbol: null
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

            let LAMPORTS_PER_TOKEN = 10**formData.decimals;
            if (formData.decimals === null) {
                LAMPORTS_PER_TOKEN = LAMPORTS_PER_SOL;
            }
            const rewardAmountTotal = formData.numberNFTs * formData.rewardAmountPerNft * LAMPORTS_PER_TOKEN;
            const rewardAmountPerNft = formData.rewardAmountPerNft * LAMPORTS_PER_TOKEN;

            // ACCOUNTS
            const initializerAccount = publicKey;

            const distributorAccount = new Keypair();
            const createDistributorAccountIx = SystemProgram.createAccount({
                space: MAX_DISTRIBUTOR_ACCOUNT_LENGTH,
                lamports: await connection.getMinimumBalanceForRentExemption(MAX_DISTRIBUTOR_ACCOUNT_LENGTH, 'confirmed'),
                fromPubkey: publicKey,
                newAccountPubkey: distributorAccount.publicKey,
                programId: programId
            });

            const tokenMintAccountPubkey = new PublicKey(formData.rewardTokenMint);
            const rewardTokenAccountSrc = await findAssociatedTokenAddress(publicKey, tokenMintAccountPubkey);

            const rewardTokenAccount = new Keypair();
            const createRewardTokenAccountIx = SystemProgram.createAccount({
                programId: TOKEN_PROGRAM_ID,
                space: AccountLayout.span,
                lamports: await connection.getMinimumBalanceForRentExemption(AccountLayout.span, 'confirmed'),
                fromPubkey: publicKey,
                newAccountPubkey: rewardTokenAccount.publicKey
            });
            const initRewardAccountIx = Token.createInitAccountInstruction(TOKEN_PROGRAM_ID, tokenMintAccountPubkey, rewardTokenAccount.publicKey, publicKey);
            const transferTokensToRewardAccIx = Token
                .createTransferInstruction(
                    TOKEN_PROGRAM_ID, 
                    rewardTokenAccountSrc, 
                    rewardTokenAccount.publicKey, 
                    publicKey, 
                    [], 
                    rewardAmountTotal
                );    
                
            transaction.add(
                createDistributorAccountIx,
                createRewardTokenAccountIx,
                initRewardAccountIx,
                transferTokensToRewardAccIx
            );

            const collectionCreatorAccount = new PublicKey(formData.collectionCreatorAccount);

            const startTs = new Date(formData.startTs).getTime()/1000;

            if (formData.symbol === null) formData.symbol = ""; 

            const createDistributorIx = await createDistributor(
                rewardAmountTotal,
                rewardAmountPerNft,
                startTs,
                formData.symbol,
                initializerAccount,
                distributorAccount.publicKey,
                rewardTokenAccount.publicKey,
                collectionCreatorAccount,
                programId
            );
            transaction.add(
                createDistributorIx
            );

            let { blockhash } = await connection.getRecentBlockhash();
            transaction.recentBlockhash = blockhash;
            transaction.feePayer = publicKey;
            transaction.partialSign(distributorAccount);
            transaction.partialSign(rewardTokenAccount);

            const signature = await sendTransaction(transaction, connection);

            await connection.confirmTransaction(signature, 'confirmed');

            const account = await connection.getAccountInfo(distributorAccount.publicKey, 'confirmed');

            const distributorData = deserializeUnchecked(CLAIM_TOKEN_PROGRAM_SCHEMA, DistributorState, account.data);

            const distributorDataNew = {...distributorData};
            distributorDataNew.amountClaimed = distributorData.amountClaimed.toNumber();
            distributorDataNew.rewardAmountPerNft = distributorData.rewardAmountPerNft.toNumber();
            distributorDataNew.rewardAmountTotal = distributorData.rewardAmountTotal.toNumber();
            distributorDataNew.publicKey = distributorAccount.publicKey.toBase58();

            console.log(distributorDataNew);

        } catch(e) {
            alert(e);
        }
    };

    return (
        <div>
            <h2>Create Distributor</h2>
            <label>Reward Token Mint</label> <br/>
            <input type="text" name="rewardTokenMint" onChange={(e) => updateForm(e)}/> <br/>
            <label>Reward Token Decimals</label> <br/>
            <input type="number" name="decimals" onChange={(e) => updateForm(e)}/> <br/>
            <label>Number of NFTs</label> <br/>
            <input type="number" name="numberNFTs" onChange={(e) => updateForm(e)}/> <br/>
            <label>Reward Amount Per NFT</label> <br/>
            <input type="number" name="rewardAmountPerNft" onChange={(e) => updateForm(e)}/> <br/>
            <label>Start Time</label> <br/>
            <input type="datetime-local" name="startTs" onChange={(e) => updateForm(e)}/> <br/>
            <label>NFT Collection Creator Account</label> <br/>
            <input type="text" name="collectionCreatorAccount" onChange={(e) => updateForm(e)}/> <br/>
            <label>NFT Collection Symbol</label> <br/>
            <input type="text" name="symbol" onChange={(e) => updateForm(e)}/> <br/>
            <button onClick={onClick} disabled={!publicKey}>
                Create Distributor
            </button>
        </div>
    );
};
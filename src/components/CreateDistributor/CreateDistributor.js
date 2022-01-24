import { WalletNotConnectedError } from '@solana/wallet-adapter-base';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { Keypair, PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import { useState } from 'react';
import { Token, TOKEN_PROGRAM_ID, AccountLayout } from '@solana/spl-token';
import { createDistributor, CLAIM_TOKEN_PROGRAM_SCHEMA, MAX_DISTRIBUTOR_ACCOUNT_LENGTH, DistributorState } from '../../util/createDistributor';
import { deserializeUnchecked } from 'borsh';
import { useSelector } from 'react-redux';

export const CreateDistributor = () => {
    const { connection } = useConnection();
    const { publicKey, sendTransaction } = useWallet();

    const programId = useSelector(state => new PublicKey(state.programId));

    const [formData, updateFormData] = useState({
        collectionCreatorAccount: null,
        rewardTokenAccount: null,
        rewardTokenMint: null,
        rewardAmountTotal: null,
        rewardAmountPerNft: null,
        startTs: null,
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

            const rewardTokenAccountSrc = new PublicKey(formData.rewardTokenAccount);

            const tokenMintAccountPubkey = new PublicKey(formData.rewardTokenMint);
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
                .createTransferInstruction(TOKEN_PROGRAM_ID, rewardTokenAccountSrc, rewardTokenAccount.publicKey, publicKey, [], formData.rewardAmountTotal);    
                
            transaction.add(
                createDistributorAccountIx,
                createRewardTokenAccountIx,
                initRewardAccountIx,
                transferTokensToRewardAccIx
            );

            const collectionCreatorAccount = new PublicKey(formData.collectionCreatorAccount);

            const startTs = new Date(formData.startTs).getTime()/1000;

            const createDistributorIx = await createDistributor(
                formData.rewardAmountTotal,
                formData.rewardAmountPerNft,
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

            console.log(distributorDataNew);

        } catch(e) {
            alert(e);
        }
    };

    return (
        <div>
            <h2>Create Distributor</h2>
            <input type="text" placeholder="Collection Creator Account" name="collectionCreatorAccount" onChange={(e) => updateForm(e)}/> <br/>
            <input type="text" placeholder="Reward Token Account" name="rewardTokenAccount" onChange={(e) => updateForm(e)}/> <br/>
            <input type="text" placeholder="Reward Token Mint" name="rewardTokenMint" onChange={(e) => updateForm(e)}/> <br/>
            <input type="number" placeholder="Reward Amount Total" name="rewardAmountTotal" onChange={(e) => updateForm(e)}/> <br/>
            <input type="number" placeholder="Reward Amount Per NFT" name="rewardAmountPerNft" onChange={(e) => updateForm(e)}/> <br/>
            <input type="datetime-local" name="startTs" onChange={(e) => updateForm(e)}/> <br/>
            <input type="text" placeholder="Symbol" name="symbol" onChange={(e) => updateForm(e)}/> <br/>
            <button onClick={onClick} disabled={!publicKey}>
                Create Distributor
            </button>
        </div>
    );
};
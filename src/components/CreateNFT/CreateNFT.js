import { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID, Token, MintLayout } from '@solana/spl-token';
import { WalletNotConnectedError } from '@solana/wallet-adapter-base';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { SystemProgram, Transaction, PublicKey, SYSVAR_RENT_PUBKEY, TransactionInstruction, Keypair, LAMPORTS_PER_SOL } from '@solana/web3.js';
import {findAssociatedTokenAddress} from '../../util/findAssociatedTokenAddress';
import { createMetadata } from '../../util/createMetadata';
import { useState } from 'react';

export const CreateNFT = () => {
    const { connection } = useConnection();
    const { publicKey, sendTransaction } = useWallet();


    const [formData, updateFormData] = useState({
        name: null,
        symbol: null,
        jsonUri: null
    });

    const updateForm = (e) => {
        const form = {...formData};
        const field = e.target.name;
        form[field] = e.target.value;
        updateFormData(form);
    }

    const onClick = async () => {
        if (!publicKey) throw new WalletNotConnectedError();

        const transaction = new Transaction();
 
        // Create new token mint
        const mintAccount = Keypair.generate();

        // Allocate memory for the account
        const balanceNeeded = await Token.getMinBalanceRentForExemptMint(
            connection,
        );

        transaction.add(
            SystemProgram.createAccount({
                fromPubkey: publicKey,
                newAccountPubkey: mintAccount.publicKey,
                lamports: balanceNeeded,
                space: MintLayout.span,
                programId: TOKEN_PROGRAM_ID,
            }),
        );

        // initialize the token account
        const initMintIx = Token.createInitMintInstruction(
            TOKEN_PROGRAM_ID,
            mintAccount.publicKey,
            0,
            publicKey,
            publicKey,
        );
        transaction.add(
            initMintIx
        );

        // Create an associated token account
        const associatedAccountPubkey = await findAssociatedTokenAddress(publicKey, mintAccount.publicKey);
        const createAssociatedTokenAccountIx = new TransactionInstruction({
            programId: new PublicKey(ASSOCIATED_TOKEN_PROGRAM_ID),
            keys: [
                { pubkey: publicKey, isSigner: true, isWritable: true },
                { pubkey: associatedAccountPubkey, isSigner: false, isWritable: true },
                { pubkey: publicKey, isSigner: false, isWritable: false },
                { pubkey: mintAccount.publicKey, isSigner: false, isWritable: false },
                { pubkey: SystemProgram.programId, isSigner: false, isWritable: false},
                { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false},
                { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false }
            ],
            data: []
        });
        transaction.add(createAssociatedTokenAccountIx);

        // Mint a token to the associated token account
        const mintToIx = Token.createMintToInstruction(
            TOKEN_PROGRAM_ID,
            mintAccount.publicKey,
            associatedAccountPubkey,
            publicKey,
            [],
            1
        );
        transaction.add(mintToIx);

        // Add the metadata
        const metadataProgramIdString = "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s";
        const metadataProgramId = new PublicKey(metadataProgramIdString);
        const metadataAccount = await PublicKey.findProgramAddress([Buffer.from("metadata"), metadataProgramId.toBuffer(), mintAccount.publicKey.toBuffer()], metadataProgramId);
        
        const metadataIx = await createMetadata(
            // data args
            formData.name,
            formData.symbol,
            formData.jsonUri,
            0,
            [publicKey.toBase58()],
            // metadata args
            publicKey.toBase58(),
            mintAccount.publicKey.toBase58(),
            publicKey.toBase58(),
            publicKey.toBase58(),
            metadataAccount[0],
            metadataProgramIdString
        );
        transaction.add(metadataIx);
    
        let { blockhash } = await connection.getRecentBlockhash();
        transaction.recentBlockhash = blockhash;
        transaction.feePayer = publicKey;
        transaction.partialSign(mintAccount);
        const signature = await sendTransaction(transaction, connection);
    
        const confirmation = await connection.confirmTransaction(signature, 'confirmed');
        
        let nft = {
            mint: mintAccount.publicKey.toBase58(),
            token_account: associatedAccountPubkey.toBase58()
        }
        console.log(confirmation, nft);
    };

    return (
        <div>
            <h2>Create NFT</h2>
            <label>NFT Name</label> <br/>
            <input type="text" name="name" onChange={(e)=>updateForm(e)}/> <br/>
            <label>NFT Symbol</label> <br/>
            <input type="text" name="symbol" onChange={(e)=>updateForm(e)}/> <br/>
            <label>JSON URI</label> <br/>
            <input type="text" name="jsonUri" onChange={(e)=>updateForm(e)}/> <br />
            <button onClick={onClick} disabled={!publicKey}>
                Create NFT
            </button>
        </div>
    );
};
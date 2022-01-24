import { PublicKey, TransactionInstruction, SYSVAR_CLOCK_PUBKEY, SYSVAR_RENT_PUBKEY, SystemProgram } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { CLAIM_TOKEN_PROGRAM_SCHEMA, ClaimTokensArgs } from './schema';
import { serialize } from "borsh";

export * from './borsh';

export async function claimTokens(
    initializerAccount: PublicKey,
    distributorStateAccount: PublicKey,
    distributorRewardAccount: PublicKey,
    claimantRewardAccount: PublicKey,
    pdaAccount: PublicKey,
    claimantNFTAccount: PublicKey,
    NFTMetadataAccount: PublicKey,
    pdaProofOfReceiptAccount: PublicKey,
    programId: PublicKey
  ) {
  
    const value = new ClaimTokensArgs();
    const txnData = Buffer.from(serialize(CLAIM_TOKEN_PROGRAM_SCHEMA, value));
  
    const keys = [
      {
        pubkey: initializerAccount,
        isSigner: true,
        isWritable: true,
      },
      {
        pubkey: distributorStateAccount,
        isSigner: false,
        isWritable: true,
      },
      {
        pubkey: distributorRewardAccount,
        isSigner: false,
        isWritable: true,
      },
      {
        pubkey: claimantRewardAccount,
        isSigner: false,
        isWritable: true,
      },
      {
        pubkey: pdaAccount,
        isSigner: false,
        isWritable: false,
      },
      {
        pubkey: claimantNFTAccount,
        isSigner: false,
        isWritable: false,
      },
      {
        pubkey: NFTMetadataAccount,
        isSigner: false,
        isWritable: false,
      },
      {
        pubkey: pdaProofOfReceiptAccount,
        isSigner: false,
        isWritable: true
      },
      {
        pubkey: SYSVAR_CLOCK_PUBKEY,
        isSigner: false,
        isWritable: false,
      },
      {
        pubkey: SYSVAR_RENT_PUBKEY,
        isSigner: false,
        isWritable: false,
      },
      {
        pubkey: TOKEN_PROGRAM_ID,
        isSigner: false,
        isWritable: false,
      },
      {
          pubkey: SystemProgram.programId,
          isSigner: false,
          isWritable: false,
      }
    ];
    
    let ix = new TransactionInstruction({
      keys,
      programId: programId,
      data: txnData,
    });
  
    return ix;
  }

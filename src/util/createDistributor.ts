import { PublicKey, TransactionInstruction, SYSVAR_RENT_PUBKEY } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { serialize } from 'borsh';
import { toPublicKey } from "./schema";
import { I64 } from "./borsh";
import { CLAIM_TOKEN_PROGRAM_SCHEMA, CreateDistributorArgs } from './schema';

export * from './borsh';

export async function createDistributor(
    rewardAmountTotal: number,
    rewardAmountPerNft: number,
    startTs: I64,
    symbol: String,
    initializerAccount: PublicKey,
    distributorAccount: PublicKey,
    rewardTokenAccount: PublicKey,
    collectionCreatorAccount: PublicKey,
    programId: PublicKey
  ) {
  
    const value = new CreateDistributorArgs({ rewardAmountTotal, rewardAmountPerNft, startTs, symbol });
    const txnData = Buffer.from(serialize(CLAIM_TOKEN_PROGRAM_SCHEMA, value));
  
    const keys = [
      {
        pubkey: toPublicKey(initializerAccount),
        isSigner: true,
        isWritable: true,
      },
      {
        pubkey: toPublicKey(distributorAccount),
        isSigner: false,
        isWritable: true,
      },
      {
        pubkey: toPublicKey(rewardTokenAccount),
        isSigner: false,
        isWritable: true,
      },
      {
        pubkey: toPublicKey(collectionCreatorAccount),
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
    ];
    
    let ix = new TransactionInstruction({
      keys,
      programId: toPublicKey(programId),
      data: txnData,
    });

    console.log(ix);
  
    return ix;
  }

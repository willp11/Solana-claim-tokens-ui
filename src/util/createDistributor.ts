import { PublicKey, TransactionInstruction, SYSVAR_RENT_PUBKEY } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { serialize } from 'borsh';
export * from './borsh';

export type StringPublicKey = string;
export type I64 = number;

const PubKeysInternedMap = new Map<string, PublicKey>();

export const toPublicKey = (key: string | PublicKey) => {
    if (typeof key !== 'string') {
      return key;
    }
  
    let result = PubKeysInternedMap.get(key);
    if (!result) {
      result = new PublicKey(key);
      PubKeysInternedMap.set(key, result);
    }
  
    return result;
};

export class CreateDistributorArgs {
    instruction: number = 0;
    rewardAmountTotal: number;
    rewardAmountPerNft: number;
    startTs: I64;
    symbol: String;
  
    constructor(args: { rewardAmountTotal: number; rewardAmountPerNft: number; startTs: number; symbol: String }) {
      this.rewardAmountTotal = args.rewardAmountTotal;
      this.rewardAmountPerNft = args.rewardAmountPerNft;
      this.startTs = args.startTs;
      this.symbol = args.symbol;
    }
}

export class DistributorState {
    isInitialized: boolean;
    authority: StringPublicKey;
    rewardTokenAccount: StringPublicKey;
    rewardMint: StringPublicKey;
    rewardAmountTotal: number;
    rewardAmountPerNft: number;
    amountClaimed: number;
    startTs: I64;
    collectionSymbol: string;
    collectionCreator: StringPublicKey

    constructor(args: { 
      isInitialized: boolean; 
      authority: StringPublicKey; 
      rewardTokenAccount: StringPublicKey;
      rewardMint: StringPublicKey;
      rewardAmountTotal: number;
      rewardAmountPerNft: number;
      amountClaimed: number;
      startTs: I64;
      collectionSymbol: string;
      collectionCreator: StringPublicKey
    }) {
      this.isInitialized = args.isInitialized;
      this.authority = args.authority;
      this.rewardTokenAccount = args.rewardTokenAccount;
      this.rewardMint = args.rewardMint;
      this.rewardAmountTotal = args.rewardAmountTotal;
      this.rewardAmountPerNft = args.rewardAmountPerNft;
      this.amountClaimed = args.amountClaimed;
      this.startTs = args.startTs;
      this.collectionSymbol = args.collectionSymbol;
      this.collectionCreator = args.collectionCreator;
    }
}

export const MAX_DISTRIBUTOR_ACCOUNT_LENGTH = 1 + 32 + 32 + 32 + 32 + 8 + 8 + 10 + 32;

export const CLAIM_TOKEN_PROGRAM_SCHEMA = new Map<any, any>([
    [
      CreateDistributorArgs,
      {
        kind: 'struct',
        fields: [
          ['instruction', 'u8'],
          ['rewardAmountTotal', 'u64'],
          ['rewardAmountPerNft', 'u64'],
          ['startTs', 'i64'],
          ['symbol', 'string']
        ],
      },
    ],
    [
      DistributorState,
      {
        kind: 'struct',
        fields: [
          ['isInitialized', 'u8'],
          ['authority', 'pubkeyAsString'],
          ['rewardTokenAccount', 'pubkeyAsString'],
          ['rewardMint', 'pubkeyAsString'],
          ['rewardAmountTotal', 'u64'],
          ['rewardAmountPerNft', 'u64'],
          ['amountClaimed', 'u64'],
          ['startTs', 'i64'],
          ['collectionSymbol', 'string'],
          ['collectionCreator', 'pubkeyAsString']
        ],
      },
    ]
]);

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

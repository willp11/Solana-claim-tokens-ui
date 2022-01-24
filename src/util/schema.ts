
import { PublicKey, TransactionInstruction, SYSVAR_RENT_PUBKEY } from "@solana/web3.js";
import { DistributorState } from "./state";
import { I64 } from "./borsh";

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

export class ClaimTokensArgs {
    instruction: number = 1;
}


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
    ],
    [
        ClaimTokensArgs,
        {
            kind: 'struct',
            fields: [
            ['instruction', 'u8']
            ],
        }
    ]
]);
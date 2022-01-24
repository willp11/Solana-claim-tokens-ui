import { StringPublicKey, I64 } from "./borsh";

export const MAX_DISTRIBUTOR_ACCOUNT_LENGTH = 1 + 32 + 32 + 32 + 32 + 8 + 8 + 10 + 32;

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
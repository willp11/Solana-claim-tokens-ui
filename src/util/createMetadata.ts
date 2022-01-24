import { PublicKey, TransactionInstruction, SystemProgram, SYSVAR_RENT_PUBKEY } from "@solana/web3.js";
import { serialize } from 'borsh';
export * from './borsh';

export type StringPublicKey = string;

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

class CreateMetadataArgs {
  instruction: number = 0;
  data: Data;
  isMutable: boolean;

  constructor(args: { data: Data; isMutable: boolean }) {
    this.data = args.data;
    this.isMutable = args.isMutable;
  }
}

class UpdateMetadataArgs {
    instruction: number = 1;
    data: Data | null;
    // Not used by this app, just required for instruction
    updateAuthority: StringPublicKey | null;
    primarySaleHappened: boolean | null;
    constructor(args: {
      data?: Data;
      updateAuthority?: string;
      primarySaleHappened: boolean | null;
    }) {
      this.data = args.data ? args.data : null;
      this.updateAuthority = args.updateAuthority ? args.updateAuthority : null;
      this.primarySaleHappened = args.primarySaleHappened;
    }
}

export class Creator {
  address: StringPublicKey;
  verified: boolean;
  share: number;

  constructor(args: {
    address: StringPublicKey;
    verified: boolean;
    share: number;
  }) {
    this.address = args.address;
    this.verified = args.verified;
    this.share = args.share;
  }
}

export class Data {
  name: string;
  symbol: string;
  uri: string;
  sellerFeeBasisPoints: number;
  creators: Creator[] | null;
  constructor(args: {
    name: string;
    symbol: string;
    uri: string;
    sellerFeeBasisPoints: number;
    creators: Creator[] | null;
  }) {
    this.name = args.name;
    this.symbol = args.symbol;
    this.uri = args.uri;
    this.sellerFeeBasisPoints = args.sellerFeeBasisPoints;
    this.creators = args.creators;
  }
}

export async function createMetadata(
  // data args
  name: string,
  symbol: string,
  uri: string,
  sellerFeeBasisPoints: number,
  creatorStrings: string[],
  // metadata args
  updateAuthority: StringPublicKey,
  mintKey: StringPublicKey,
  mintAuthorityKey: StringPublicKey,
  payer: StringPublicKey,
  metadataAccount: PublicKey,
  metadataProgramId: StringPublicKey
) {

  // create creators array
  let creators: Creator[] = [];
  for (let i=0; i<creatorStrings.length; i++) {
    let creator = new Creator({
      address: creatorStrings[i],
      verified: true,
      share: 100
    });
    creators.push(creator);
  }

  // create data
  const data = new Data({
    name,
    symbol,
    uri,
    sellerFeeBasisPoints,
    creators
  })

  const value = new CreateMetadataArgs({ data, isMutable: true });
  const txnData = Buffer.from(serialize(METADATA_SCHEMA, value));

  const keys = [
    {
      pubkey: toPublicKey(metadataAccount),
      isSigner: false,
      isWritable: true,
    },
    {
      pubkey: toPublicKey(mintKey),
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: toPublicKey(mintAuthorityKey),
      isSigner: true,
      isWritable: false,
    },
    {
      pubkey: toPublicKey(payer),
      isSigner: true,
      isWritable: false,
    },
    {
      pubkey: toPublicKey(updateAuthority),
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: SystemProgram.programId,
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: SYSVAR_RENT_PUBKEY,
      isSigner: false,
      isWritable: false,
    },
  ];
  
  let ix = new TransactionInstruction({
    keys,
    programId: toPublicKey(metadataProgramId),
    data: txnData,
  });

  
  return ix;
}

export async function updateMetadata(
  updateAuthority: StringPublicKey,
  metadataAccount: StringPublicKey,
  metadataProgramId: StringPublicKey
) {

  const value = new UpdateMetadataArgs({
    data: undefined,
    updateAuthority: undefined,
    primarySaleHappened: true
  });
  const txnData = Buffer.from(serialize(METADATA_SCHEMA, value));
  const keys = [
    {
      pubkey: toPublicKey(metadataAccount),
      isSigner: false,
      isWritable: true,
    },
    {
      pubkey: toPublicKey(updateAuthority),
      isSigner: true,
      isWritable: false,
    },
  ];
  
  let ix = 
    new TransactionInstruction({
      keys,
      programId: toPublicKey(metadataProgramId),
      data: txnData,
    });

  return ix;
}


export const METADATA_SCHEMA = new Map<any, any>([
  [
    CreateMetadataArgs,
    {
      kind: 'struct',
      fields: [
        ['instruction', 'u8'],
        ['data', Data],
        ['isMutable', 'u8'], // bool
      ],
    },
  ],
  [
    UpdateMetadataArgs,
    {
      kind: 'struct',
      fields: [
        ['instruction', 'u8'],
        ['data', { kind: 'option', type: Data }],
        ['updateAuthority', { kind: 'option', type: 'pubkeyAsString' }],
        ['primarySaleHappened', { kind: 'option', type: 'u8' }],
      ],
    },
  ],
  [
    Data,
    {
      kind: 'struct',
      fields: [
        ['name', 'string'],
        ['symbol', 'string'],
        ['uri', 'string'],
        ['sellerFeeBasisPoints', 'u16'],
        ['creators', { kind: 'option', type: [Creator] }],
      ],
    },
  ],
  [
    Creator,
    {
      kind: 'struct',
      fields: [
        ['address', 'pubkeyAsString'],
        ['verified', 'u8'],
        ['share', 'u8'],
      ],
    },
  ],
]);
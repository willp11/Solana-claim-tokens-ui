import { PublicKey } from '@solana/web3.js';
import { BinaryReader, BinaryWriter } from 'borsh';
import base58 from 'bs58';
import BN from 'bn.js';
export type StringPublicKey = string;
export type I64 = number;

export const extendBorsh = () => {
  (BinaryReader.prototype as any).readPubkey = function () {
    const reader = this as unknown as BinaryReader;
    const array = reader.readFixedArray(32);
    return new PublicKey(array);
  };

  (BinaryWriter.prototype as any).writePubkey = function (
    value: PublicKey
  ) {
    const writer = this as unknown as BinaryWriter;
    writer.writeFixedArray(value.toBuffer());
  };

  (BinaryReader.prototype as any).readPubkeyAsString = function () {
    const reader = this as unknown as BinaryReader;
    const array = reader.readFixedArray(32);
    return base58.encode(array) as StringPublicKey;
  };

  (BinaryWriter.prototype as any).writePubkeyAsString = function (
    value: StringPublicKey,
  ) {
    const writer = this as unknown as BinaryWriter;
    writer.writeFixedArray(base58.decode(value));
  };

  (BinaryReader.prototype as any).readI64 = function () {
    const reader = this as unknown as BinaryReader;
    const array = reader.readFixedArray(8);
    return new BN(array, 10, "le").toNumber() as I64;
  };

  (BinaryWriter.prototype as any).writeI64 = function (
    value: I64
  ) {
    const writer = this as unknown as BinaryWriter;
    const valueBytes = new BN(value).toArray("le", 8);
    writer.writeFixedArray(Uint8Array.of(...valueBytes));
  };
};

extendBorsh();
import {
  stringToBytes,
  padUint8ArrayWithZeros,
  packBytesIntoNBytes,
} from "@zk-email/helpers";
import { buildPoseidon } from "circomlibjs";

const CHUNK_SIZE = 31;
const MAX_SENDER_EMAIL_LENGTH = 256;
const MAX_TX_BODY_LENGTH = 512;

export async function calculateTxBodyHash(txBody: string) {
  const txBodyBuffer = stringToBytes(txBody);
  const txBodyPadded = padUint8ArrayWithZeros(txBodyBuffer, MAX_TX_BODY_LENGTH);
  const txBodyBytes = packBytesIntoNBytes(txBodyPadded, CHUNK_SIZE);

  const hashChunkSize = 16;
  const totalChunks = Math.ceil(txBodyBytes.length / hashChunkSize);
  const lastChunkSize = txBodyBytes.length % hashChunkSize;

  const poseidon = await buildPoseidon();
  let txBodyHash;

  for (let i = 0; i < totalChunks; i++) {
    let chunk = txBodyBytes.slice(i * hashChunkSize, (i + 1) * hashChunkSize);

    if (i === totalChunks - 1) {
      chunk = chunk.slice(0, lastChunkSize);
    }

    const chunkHash = poseidon(chunk);

    if (i === 0) {
      txBodyHash = chunkHash;
    } else {
      txBodyHash = poseidon([txBodyHash!, chunkHash]);
    }
  }

  return poseidon.F.toObject(txBodyHash);
}

export async function calculateEmailAddrCommit(
  salt: string,
  emailAddress: string
) {
  let saltBuffer = stringToBytes(salt);
  let emailSaltPadded = padUint8ArrayWithZeros(saltBuffer, CHUNK_SIZE);
  let senderEmailPadded = padUint8ArrayWithZeros(
    Buffer.from(emailAddress),
    MAX_SENDER_EMAIL_LENGTH
  );

  let emailSaltPacked = packBytesIntoNBytes(emailSaltPadded, CHUNK_SIZE);
  let senderEmailPacked = packBytesIntoNBytes(senderEmailPadded, CHUNK_SIZE);

  const poseidon = await buildPoseidon();
  const hash = poseidon([...emailSaltPacked, ...senderEmailPacked]);

  return poseidon.F.toObject(hash);
}

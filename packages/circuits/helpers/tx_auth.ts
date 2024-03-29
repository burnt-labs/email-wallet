import fs from "fs";
import { promisify } from "util";
import { generateCircuitInputs } from "@zk-email/helpers/dist/input-helpers";
import { verifyDKIMSignature } from "@zk-email/helpers/dist/dkim";

export type TxAuthCircuitInput = {
  in_padded: string[];
  pubkey: string[];
  signature: string[];
  in_len_padded_bytes: string;
  precomputed_sha?: string[];
  in_body_padded?: string[];
  in_body_len_padded_bytes?: string;
  body_hash_idx?: string;
}

export async function genTxAuthInputs(emailFilePath: string): Promise<TxAuthCircuitInput> {
  
  const max_message_length = 1024;
  const max_body_length = 1024;

  const emailRaw = await promisify(fs.readFile)(emailFilePath, "utf8");
  const dkimResult = await verifyDKIMSignature(Buffer.from(emailRaw));
  const emailCircuitInputs = generateCircuitInputs({
    rsaSignature: dkimResult.signature,
    rsaPublicKey: dkimResult.publicKey,
    body: dkimResult.body,
    bodyHash: dkimResult.bodyHash,
    message: dkimResult.message,
    maxMessageLength: max_message_length,
    maxBodyLength: max_body_length
  });

  return emailCircuitInputs;
}

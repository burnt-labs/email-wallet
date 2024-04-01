import fs from "fs";
import { promisify } from "util";
import { generateCircuitInputs } from "@zk-email/helpers/dist/input-helpers";
import { verifyDKIMSignature } from "@zk-email/helpers/dist/dkim";

export type TxAuthCircuitInput = {
  in_padded: string[];
  pubkey: string[];
  signature: string[];
  tx_body_idx: string;
  email_salt_idx: string;
  sender_email_idx: string;
  in_len_padded_bytes: string;
};

export async function genTxAuthInputs(emailFilePath: string): Promise<TxAuthCircuitInput> {
  const max_message_length = 1024;
  const max_body_length = 2048;

  const emailRaw = await promisify(fs.readFile)(emailFilePath, "utf8");
  const dkimResult = await verifyDKIMSignature(Buffer.from(emailRaw));
  const emailCircuitInputs = generateCircuitInputs({
    rsaSignature: dkimResult.signature,
    rsaPublicKey: dkimResult.publicKey,
    body: dkimResult.body,
    bodyHash: dkimResult.bodyHash,
    message: dkimResult.message,
    maxMessageLength: max_message_length,
    maxBodyLength: max_body_length,
    ignoreBodyHashCheck: true,
  });

  const data = emailCircuitInputs.in_padded!.map((x) => Number(x));

  // get index of all `#` in data
  const idx = data.reduce((a: number[], e, i) => {
    if (e === 35) a.push(i);
    return a;
  }, []);

  const tx_body_idx = idx[0] + 1;
  const email_salt_idx = idx[1] + 1;

  const selectorBuffer = Buffer.from("from:");
  let sender_email_idx = Buffer.from(data).indexOf(selectorBuffer) + selectorBuffer.length;
  sender_email_idx = Buffer.from(data).slice(sender_email_idx).indexOf(Buffer.from("<")) + sender_email_idx + 1;

  console.log("sender_email_idx", sender_email_idx);

  return {
    ...emailCircuitInputs,
    tx_body_idx: tx_body_idx.toString(),
    email_salt_idx: email_salt_idx.toString(),
    sender_email_idx: sender_email_idx.toString(),
  };
}

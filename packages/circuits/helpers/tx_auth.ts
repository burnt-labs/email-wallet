import fs from "fs";
import { promisify } from "util";
import { generateCircuitInputs } from "@zk-email/helpers/dist/input-helpers";
import { verifyDKIMSignature } from "@zk-email/helpers/dist/dkim";
const emailWalletUtils = require("../../utils");

export const SENDER_ADDRESS_MAX_BYTES = 256;
export const EMAIL_SALT_MAX_BYTES = 31;
export const EMAIL_HEADER_MAX_BYTES = 1024;
export const EMAIL_BODY_MAX_BYTES = 2048;

export type TxAuthCircuitInput = {
  in_padded: string[];
  in_len_padded_bytes: string;
  pubkey: string[];
  signature: string[];
  in_body_padded: string[];
  in_body_len_padded_bytes: string;
  body_hash_idx: string;
  precomputed_sha: string[];
  tx_data_idx: string;
  tx_body_idx: string;
  sender_email_idx: string;
  email_salt_idx: string;
};

export async function getEmailSalt(rawEmail: string): Promise<string> {
  /// the email body format is as follows:
  /// #tx_data_base64_encoded#email_salt#
  const emailBody = rawEmail.replaceAll("\r\n", "").split("#");
  return emailBody[2];
}

export async function getTxData(rawEmail: string): Promise<string> {
  /// the email body format is as follows:
  /// #tx_data_base64_encoded#email_salt#
  const emailBody = rawEmail.replaceAll("\r\n", "").split("#");
  return emailBody[1];
}

export async function getEmailSender(rawEmail: string): Promise<string> {
  const selectorBuffer = Buffer.from("from:");
  let sender_email_idx = Buffer.from(rawEmail).indexOf(selectorBuffer) + selectorBuffer.length;
  sender_email_idx = Buffer.from(rawEmail).slice(sender_email_idx).indexOf(Buffer.from("<")) + sender_email_idx + 1;
  const sender_email_end_idx =
    Buffer.from(rawEmail).slice(sender_email_idx).indexOf(Buffer.from(">")) + sender_email_idx;
  return rawEmail.slice(sender_email_idx, sender_email_end_idx);
}

export async function genTxAuthInputs(emailFilePath: string): Promise<TxAuthCircuitInput> {
  const emailRaw = await promisify(fs.readFile)(emailFilePath, "utf8");
  const dkimResult = await verifyDKIMSignature(Buffer.from(emailRaw));
  const emailCircuitInputs = generateCircuitInputs({
    rsaSignature: dkimResult.signature,
    rsaPublicKey: dkimResult.publicKey,
    body: dkimResult.body,
    bodyHash: dkimResult.bodyHash,
    message: dkimResult.message,
    maxMessageLength: EMAIL_HEADER_MAX_BYTES,
    maxBodyLength: EMAIL_BODY_MAX_BYTES,
    ignoreBodyHashCheck: false,
  });

  const body_data = emailCircuitInputs.in_body_padded!.map((x) => Number(x));
  const header_data = emailCircuitInputs.in_padded!.map((x) => Number(x));

  // get index of all `$` in data
  const _$_idx = body_data.reduce((a: number[], e, i) => {
    if (e === 36) a.push(i);
    return a;
  }, []);

  const tx_data_idx = _$_idx[0] + 3; // skip $\r\n

  // extract flat tx data between the #s
  const tx_data = body_data.slice(_$_idx[0], _$_idx[1]).filter((x) => x !== 13 && x !== 10 && x !== 36);

  // get all # indexes in tx_data
  const idx = tx_data.reduce((a: number[], e, i) => {
    if (e === 35) a.push(i);
    return a;
  }, []);

  const tx_body_idx = idx[0] + 1;
  const email_salt_idx = idx[1] + 1;

  const selectorBuffer = Buffer.from("from:");
  let sender_email_idx = Buffer.from(header_data).indexOf(selectorBuffer) + selectorBuffer.length;
  sender_email_idx = Buffer.from(header_data).slice(sender_email_idx).indexOf(Buffer.from("<")) + sender_email_idx + 1;

  return {
    ...emailCircuitInputs,
    in_body_padded: emailCircuitInputs.in_body_padded!,
    in_body_len_padded_bytes: emailCircuitInputs.in_body_len_padded_bytes!,
    body_hash_idx: emailCircuitInputs.body_hash_idx!,
    precomputed_sha: emailCircuitInputs.precomputed_sha!,
    tx_data_idx: tx_data_idx.toString(),
    tx_body_idx: tx_body_idx.toString(),
    email_salt_idx: email_salt_idx.toString(),
    sender_email_idx: sender_email_idx.toString(),
  };
}

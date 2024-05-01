import fs from "fs";
import { promisify } from "util";
import { generateEmailVerifierInputs } from "@zk-email/helpers";

export const EMAIL_HEADER_MAX_BYTES = 1024;
export const EMAIL_BODY_MAX_BYTES = 2048;

export type TxAuthCircuitInput = {
  emailHeader: string[];
  emailHeaderLength: string;
  pubkey: string[];
  signature: string[];
  emailBody?: string[];
  emailBodyLength?: string;
  precomputedSHA?: string[];
  bodyHashIndex?: string;
  txDataIdx: string;
  txBodyIdx: string;
  senderEmailIdx: string;
  emailSaltIdx: string;
};

export async function getEmailSalt(rawEmail: string): Promise<string> {
  /// the email body format is as follows:
  /// #tx_data_base64_encoded#email_salt#
  const emailBody = rawEmail
    .replaceAll("\r\n", "")
    .replaceAll("\n", "")
    .split("#");
  return emailBody[2];
}

export async function getTxBody(rawEmail: string): Promise<string> {
  /// the email body format is as follows:
  /// #tx_data_base64_encoded#email_salt#
  const emailBody = rawEmail
    .replaceAll("\r\n", "")
    .replaceAll("\n", "")
    .split("#");
  return emailBody[1];
}

export async function getEmailSender(rawEmail: string): Promise<string> {
  const selectorBuffer = Buffer.from("from:");
  let sender_email_idx =
    Buffer.from(rawEmail).indexOf(selectorBuffer) + selectorBuffer.length;
  sender_email_idx =
    Buffer.from(rawEmail).slice(sender_email_idx).indexOf(Buffer.from("<")) +
    sender_email_idx +
    1;
  const sender_email_end_idx =
    Buffer.from(rawEmail).slice(sender_email_idx).indexOf(Buffer.from(">")) +
    sender_email_idx;
  return rawEmail.slice(sender_email_idx, sender_email_end_idx);
}

export async function getInputs(emailFilePath: string) {
  const emailRaw = await promisify(fs.readFile)(emailFilePath, "utf8");
  const emailCircuitInputs = await generateEmailVerifierInputs(emailRaw, {
    ignoreBodyHashCheck: false,
    maxHeadersLength: EMAIL_HEADER_MAX_BYTES,
    maxBodyLength: EMAIL_BODY_MAX_BYTES,
  });

  const bodyData = emailCircuitInputs.emailBody!.map((x) => Number(x));
  const headerData = emailCircuitInputs.emailHeader.map((x) => Number(x));

  // get index of all `$` in data
  const _$Idx = bodyData.reduce((a: number[], e, i) => {
    if (e === 36) a.push(i);
    return a;
  }, []);

  const txDataIdx = _$Idx[0] + 3; // skip $\r\n

  // extract flat tx data between the #s
  const txData = bodyData
    .slice(_$Idx[0], _$Idx[1])
    .filter((x) => x !== 13 && x !== 10 && x !== 36);

  // get all # indexes in tx_data
  const idx = txData.reduce((a: number[], e, i) => {
    if (e === 35) a.push(i);
    return a;
  }, []);

  const txBodyIdx = idx[0] + 1;
  const emailSaltIdx = idx[1] + 1;

  const selectorBuffer = Buffer.from("from:");
  let senderEmailIdx =
    Buffer.from(headerData).indexOf(selectorBuffer) + selectorBuffer.length;
  senderEmailIdx =
    Buffer.from(headerData).slice(senderEmailIdx).indexOf(Buffer.from("<")) +
    senderEmailIdx +
    1;

  const inputs: TxAuthCircuitInput = {
    ...emailCircuitInputs,
    txDataIdx: txDataIdx.toString(),
    txBodyIdx: txBodyIdx.toString(),
    emailSaltIdx: emailSaltIdx.toString(),
    senderEmailIdx: senderEmailIdx.toString(),
    emailBody: emailCircuitInputs.emailBody,
  };

  return inputs;
}

export async function generate(emailFilePath: string) {
  const inputs = await getInputs(emailFilePath);

  // write to default.json file
  const outputFilePath = emailFilePath.replace(".eml", ".json");
  await promisify(fs.writeFile)(
    outputFilePath,
    JSON.stringify(inputs, null, 2)
  );
}

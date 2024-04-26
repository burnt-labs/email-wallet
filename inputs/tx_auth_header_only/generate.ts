import fs from "fs";
import { promisify } from "util";
import { generateEmailVerifierInputs } from "@zk-email/helpers";

export const SENDER_ADDRESS_MAX_BYTES = 256;
export const EMAIL_SALT_MAX_BYTES = 31;
export const EMAIL_HEADER_MAX_BYTES = 1024;

export type TxAuthCircuitInput = {
  emailHeader: string[];
  emailHeaderLength: string;
  pubkey: string[];
  signature: string[];
  txBodyIdx: string;
  senderEmailIdx: string;
  emailSaltIdx: string;
};

export async function getEmailSalt(rawEmail: string): Promise<string> {
  /// the email body format is as follows:
  /// #tx_data_base64_encoded#email_salt#
  const emailBody = rawEmail.split("#");
  return emailBody[2];
}

export async function getTxData(rawEmail: string): Promise<string> {
  /// the email body format is as follows:
  /// #tx_data_base64_encoded#email_salt#
  const emailBody = rawEmail.split("#");
  return emailBody[1];
}

export async function getEmailSender(rawEmail: string): Promise<string> {
  const selectorBuffer = Buffer.from("from:");
  let senderEmailIdx =
    Buffer.from(rawEmail).indexOf(selectorBuffer) + selectorBuffer.length;
  senderEmailIdx =
    Buffer.from(rawEmail).slice(senderEmailIdx).indexOf(Buffer.from("<")) +
    senderEmailIdx +
    1;
  const senderEmailEndIdx =
    Buffer.from(rawEmail).slice(senderEmailIdx).indexOf(Buffer.from(">")) +
    senderEmailIdx;
  return rawEmail.slice(senderEmailIdx, senderEmailEndIdx);
}

export async function genTxAuthInputs(emailFilePath: string) {
  console.log("emailFilePath", emailFilePath);
  const emailRaw = await promisify(fs.readFile)(emailFilePath, "utf8");
  const emailInputs = await generateEmailVerifierInputs(emailRaw, {
    ignoreBodyHashCheck: true,
    maxHeadersLength: EMAIL_HEADER_MAX_BYTES,
  });

  console.log("inputs", emailInputs);

  const data = emailInputs.emailHeader!.map((x) => Number(x));

  // get index of all `#` in data
  const idx = data.reduce((a: number[], e, i) => {
    if (e === 35) a.push(i);
    return a;
  }, []);

  const txBodyIdx = idx[0] + 1;
  const emailSaltIdx = idx[1] + 1;

  const selectorBuffer = Buffer.from("from:");
  let senderEmailIdx =
    Buffer.from(data).indexOf(selectorBuffer) + selectorBuffer.length;
  senderEmailIdx =
    Buffer.from(data).slice(senderEmailIdx).indexOf(Buffer.from("<")) +
    senderEmailIdx +
    1;

  const inputs: TxAuthCircuitInput = {
    ...emailInputs,
    txBodyIdx: txBodyIdx.toString(),
    emailSaltIdx: emailSaltIdx.toString(),
    senderEmailIdx: senderEmailIdx.toString(),
  };

  // write to default.json file
  const outputFilePath = emailFilePath.replace(".eml", ".json");
  await promisify(fs.writeFile)(
    outputFilePath,
    JSON.stringify(inputs, null, 2)
  );
}

genTxAuthInputs("inputs/tx_auth_header_only/sample.eml").then(console.log);

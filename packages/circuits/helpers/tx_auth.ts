import fs from "fs";
import { promisify } from "util";
import { generateCircuitInputs } from "@zk-email/helpers/dist/input-helpers";
const emailWalletUtils = require("../../utils");


export async function genTxAuthInputs(emailFilePath: string):
  Promise<{
    in_padded: string[],
    pubkey: string[],
    signature: string[],
    in_padded_len: string
  }> {
  const emailRaw = await promisify(fs.readFile)(emailFilePath, "utf8");
  const parsedEmail = await emailWalletUtils.parseEmail(emailRaw);
  const emailCircuitInputs = generateCircuitInputs({
    rsaSignature: BigInt(parsedEmail.signature),
    rsaPublicKey: BigInt(parsedEmail.publicKey),
    body: Buffer.from(""),
    bodyHash: "",
    message: Buffer.from(parsedEmail.canonicalizedHeader),
    maxMessageLength: 1024,
    maxBodyLength: 64
  });

  return {
    in_padded: emailCircuitInputs.in_padded,
    pubkey: emailCircuitInputs.pubkey,
    signature: emailCircuitInputs.signature,
    in_padded_len: emailCircuitInputs.in_len_padded_bytes
  };
}

import fs from "fs";
import { promisify } from "util";
import { generateCircuitInputs } from "@zk-email/helpers/dist/input-helpers";
import { verifyDKIMSignature } from "@zk-email/helpers/dist/dkim";

export async function genTxAuthInputs(emailFilePath: string) {
  const emailRaw = await promisify(fs.readFile)(emailFilePath, "utf8");
  const dkimResult = await verifyDKIMSignature(Buffer.from(emailRaw));
  const emailCircuitInputs = generateCircuitInputs({
    rsaSignature: dkimResult.signature,
    rsaPublicKey: dkimResult.publicKey,
    body: dkimResult.body,
    bodyHash: dkimResult.bodyHash,
    message: dkimResult.message,
    maxMessageLength: 1024,
    maxBodyLength: 64
  });

  const inputs = {
    ...emailCircuitInputs
  }

  return inputs;
}

import { WitnessTester } from "circomkit";
import { circomkit } from "./common";
import circuits from "../circuits.json";
import {
  getEmailSender,
  getInputs,
  getTxBody,
} from "../inputs/tx_auth/generate";
import { promisify } from "util";
import fs from "fs";
import { getEmailSalt } from "../inputs/tx_auth/generate";
import { calculateEmailAddrCommit, calculateTxBodyHash } from "./utils";
import { assert } from "@zk-email/helpers";

describe("TxAuthBody", function () {
  this.timeout(1000000000);

  let circuit: WitnessTester<
    [
      "emailHeader",
      "emailHeaderLength",
      "pubkey",
      "signature",
      "emailBody",
      "emailBodyLength",
      "precomputedSHA",
      "bodyHashIndex",
      "txDataIdx",
      "txBodyIdx",
      "senderEmailIdx",
      "emailSaltIdx"
    ],
    ["txBodyHash", "emailCommitment", "pubkeyHash"]
  >;

  before(async () => {
    circuit = await circomkit.WitnessTester(`tx_auth`, circuits.tx_auth);
  });

  it("should pass with correct witness", async () => {
    const emailFilePath = "./tests/emls/body.eml";
    const emailRaw = await promisify(fs.readFile)(emailFilePath, "utf8");
    const senderEmail = await getEmailSender(emailRaw);
    const emailSalt = await getEmailSalt(emailRaw);
    const txBody = await getTxBody(emailRaw);
    const inputs = await getInputs(emailFilePath);
    const circuitInput = {
      emailHeader: inputs.emailHeader.map((x) => BigInt(x)),
      emailHeaderLength: BigInt(inputs.emailHeaderLength),
      pubkey: inputs.pubkey.map((x) => BigInt(x)),
      signature: inputs.signature.map((x) => BigInt(x)),
      emailBody: inputs.emailBody!.map((x) => BigInt(x)),
      emailBodyLength: BigInt(inputs.emailBodyLength!),
      precomputedSHA: inputs.precomputedSHA!.map((x) => BigInt(x)),
      bodyHashIndex: BigInt(inputs.bodyHashIndex!),
      txDataIdx: BigInt(inputs.txDataIdx),
      txBodyIdx: BigInt(inputs.txBodyIdx),
      senderEmailIdx: BigInt(inputs.senderEmailIdx),
      emailSaltIdx: BigInt(inputs.emailSaltIdx),
    };

    const expectedOutput = {
      txBodyHash: await calculateTxBodyHash(txBody),
      emailCommitment: await calculateEmailAddrCommit(emailSalt, senderEmail),
      pubkeyHash:
        6632353713085157925504008443078919716322386156160602218536961028046468237192n,
    };

    const witness = await circuit.calculateWitness(circuitInput);

    assert(witness[1] === expectedOutput.txBodyHash, "txBodyHash mismatch");
    assert(
      witness[2] === expectedOutput.emailCommitment,
      "emailCommitment mismatch"
    );
    assert(witness[3] === expectedOutput.pubkeyHash, "pubkeyHash mismatch");
  });
});

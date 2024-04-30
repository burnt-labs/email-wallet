import { WitnessTester } from "circomkit";
import { circomkit } from "./common";
import circuits from "../circuits.json";
import {
  getEmailSender,
  getInputs,
  getTxBody,
} from "../inputs/tx_auth_header_only/generate";
import { promisify } from "util";
import fs from "fs";
import { getEmailSalt } from "../inputs/tx_auth/generate";
import {
  stringToBytes,
  packBytesIntoNBytes,
  bytesToBigInt,
  bytesToString,
  Uint8ArrayToString,
  toHex,
  bigIntToChunkedBytes,
  toCircomBigIntBytes,
} from "@zk-email/helpers/dist/binary-format";
import { buildPoseidon } from "circomlibjs";
import { padUint8ArrayWithZeros } from "@zk-email/helpers";

describe("TxAuthHeaderOnly", () => {
  let circuit: WitnessTester<
    [
      "emailHeader",
      "emailHeaderLength",
      "pubkey",
      "signature",
      "txBodyIdx",
      "senderEmailIdx",
      "emailSaltIdx"
    ],
    ["txBodyHash", "emailCommitment", "pubkeyHash"]
  >;

  before(async () => {
    // circuit = await circomkit.WitnessTester(
    //   `tx_auth_header_only`,
    //   circuits.tx_auth_header_only
    // );
  });

  it("should have correct number of constraints", async () => {
    const emailFilePath = "./tests/emls/header.eml";
    const emailRaw = await promisify(fs.readFile)(emailFilePath, "utf8");
    const inputs = await getInputs(emailFilePath);
    const senderEmail = await getEmailSender(emailRaw);
    const emailSalt = await getEmailSalt(emailRaw);
    const txBody = await getTxBody(emailRaw);

    let saltBuffer = stringToBytes(emailSalt);
    let emailSaltPadded = padUint8ArrayWithZeros(saltBuffer, 31);
    let senderEmailPadded = padUint8ArrayWithZeros(
      Buffer.from(senderEmail),
      256
    );

    let saltBigInt = bytesToBigInt(emailSaltPadded);
    let senderEmailBigInt = bytesToBigInt(senderEmailPadded);

    const chunkSize = 31;
    let saltChunks = Math.ceil(emailSaltPadded.length / chunkSize);
    let emailChunks = Math.ceil(senderEmailPadded.length / chunkSize);

    console.log("emailSalt", saltBigInt);
    console.log("senderEmail", senderEmailBigInt);

    console.log("saltChunks", saltChunks);
    console.log("emailChunks", emailChunks);

    let emailSaltPacked = packBytesIntoNBytes(emailSaltPadded, 31);
    let senderEmailPacked = packBytesIntoNBytes(senderEmailPadded, 31);

    console.log("emailSaltPacked", emailSaltPacked);
    console.log("senderEmailPacked", senderEmailPacked);

    let data = [...emailSaltPacked, ...senderEmailPacked];

    console.log("data", data);

    const poseidon = await buildPoseidon();
    const hash = poseidon(data);

    console.log("hash", poseidon.F.toObject(hash));

    // const witness = await circuit.calculateWitness({
    //   emailHeader: inputs.emailHeader.map((x) => BigInt(x)),
    //   emailHeaderLength: BigInt(inputs.emailHeaderLength),
    //   pubkey: inputs.pubkey.map((x) => BigInt(x)),
    //   signature: inputs.signature.map((x) => BigInt(x)),
    //   txBodyIdx: BigInt(inputs.txBodyIdx),
    //   senderEmailIdx: BigInt(inputs.senderEmailIdx),
    //   emailSaltIdx: BigInt(inputs.emailSaltIdx),
    // });

    // console.log("eq", witness[1] === poseidon.F.toObject(hash));
  });

  // it("should multiply correctly", async () => {
  //   const randomNumbers = Array.from({ length: N }, () =>
  //     Math.floor(Math.random() * 100 * N)
  //   );
  //   await circuit.expectPass(
  //     { in: randomNumbers },
  //     { out: randomNumbers.reduce((prev, acc) => acc * prev) }
  //   );
  // });
});

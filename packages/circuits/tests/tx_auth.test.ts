const ff = require("ffjavascript");
const stringifyBigInts = ff.utils.stringifyBigInts;
const circom_tester = require("circom_tester");
const wasm_tester = circom_tester.wasm;
import * as path from "path";
const p = "21888242871839275222246405745257275088548364400416034343698204186575808495617";
const field = new ff.F1Field(p);
const emailWalletUtils = require("../../utils");
const option = {
  include: path.join(__dirname, "../../../node_modules"),
};
import { readFileSync } from "fs";
import { TxAuthCircuitInput, genTxAuthInputs, getEmailSalt, getEmailSender, getTxData } from "../helpers/tx_auth";

jest.setTimeout(1440000);
describe("Tx Auth", () => {
  const emailFilePath = path.join(__dirname, "./emails/email_tx_test1.eml");
  const rawEmail = readFileSync(emailFilePath, "utf8");
  let circuitInputs: TxAuthCircuitInput;

  beforeAll(async () => {
    circuitInputs = await genTxAuthInputs(emailFilePath);
  });

  it("should have parsed email into circuit inputs", async () => {
    expect(circuitInputs).toBeDefined();
  });

  it("should verify circuit outputs", async () => {
    const circuit = await wasm_tester(path.join(__dirname, "../src/tx_auth.circom"), option);
    const witness = await circuit.calculateWitness(stringifyBigInts(circuitInputs));

    // check email commitment
    const sender = await getEmailSender(rawEmail);
    const emailSalt = await getEmailSalt(rawEmail);
    const expectedEmailSaltCommitment = BigInt(await emailWalletUtils.emailSaltCommit(sender, emailSalt));
    expect(witness[2]).toEqual(expectedEmailSaltCommitment);

    // check tx data commitment
    const txData = await getTxData(rawEmail);
    const expectedTxDataCommitment = BigInt(await emailWalletUtils.txDataCommit(txData));
    expect(witness[1]).toEqual(expectedTxDataCommitment);
  });

  // helper functions tests

  it("should get email salt", async () => {
    const expectedSalt = "XRhMS5Nc2dTZW5kEpAB";
    const emailSalt = await getEmailSalt(rawEmail);
    expect(emailSalt).toEqual(expectedSalt);
  });

  it("should get tx body", async () => {
    const expectedTxData =
      "CrQBCrEBChwvY29zbW9zLmJhbmsudjFiZXRhMS5Nc2dTZW5kEpABCj94aW9uMWd2cDl5djZndDBwcmdzc3ZueWNudXpnZWszZmtyeGxsZnhxaG0wNzYwMmt4Zmc4dXI2NHNuMnAycDkSP3hpb24xNGNuMG40ZjM4ODJzZ3B2NWQ5ZzA2dzNxN3hzZm51N3B1enltZDk5ZTM3ZHAwemQ4bTZscXpwemwwbRoMCgV1eGlvbhIDMTAwEmEKTQpDCh0vYWJzdHJhY3RhY2NvdW50LnYxLk5pbFB1YktleRIiCiBDAlIzSFvCNEIMmTE+CRm0U2Gb/0mBfb/aeqxkoPweqxIECgIIARh/EhAKCgoFdXhpb24SATAQwJoMGg54aW9uLXRlc3RuZXQtMSCLjAo=";
    const txData = await getTxData(rawEmail);
    expect(txData).toEqual(expectedTxData);
  });

  it("should get email sender", async () => {
    const expectedSender = "thezdev1@gmail.com";
    const sender = await getEmailSender(rawEmail);
    expect(sender).toEqual(expectedSender);
  });
});

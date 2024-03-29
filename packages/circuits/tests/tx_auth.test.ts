const utils = require("../../utils");
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
import { TxAuthCircuitInput, genTxAuthInputs } from "../helpers/tx_auth";

jest.setTimeout(1440000);
describe("Tx Auth", () => {
  const emailFilePath = path.join(__dirname, "./emails/email_tx_test1.eml");
  let circuitInputs: TxAuthCircuitInput;
  let circuit: {
    checkConstraints(witness: any): unknown;
    calculateWitness: (arg0: any) => any;
  };
  let witness: any;

  beforeAll(async () => {
    circuitInputs = await genTxAuthInputs(emailFilePath);
    circuit = await wasm_tester(path.join(__dirname, "../src/tx_auth.circom"), option);
    witness = await circuit.calculateWitness(stringifyBigInts(circuitInputs));
  });

  it("should have parsed email into circuit inputs", async () => {
    expect(circuitInputs).toBeDefined();
  });

  it("should verify DKIM signature", async () => {
    await circuit.checkConstraints(witness);
  });
});

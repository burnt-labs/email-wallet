const utils = require("../../utils");
const ff = require('ffjavascript');
const stringifyBigInts = ff.utils.stringifyBigInts;
const circom_tester = require("circom_tester");
const wasm_tester = circom_tester.wasm;
import * as path from "path";
const p = "21888242871839275222246405745257275088548364400416034343698204186575808495617";
const field = new ff.F1Field(p);
const emailWalletUtils = require("../../utils");
const option = {
    include: path.join(__dirname, "../../../node_modules")
};
import { readFileSync } from "fs";
import { genTxAuthInputs } from "../helpers/tx_auth";

jest.setTimeout(1440000);
describe("Tx Auth", () => {
    it("should parse email", async () => {
        const emailFilePath = path.join(__dirname, "./emails/email_sender_test1.eml");
        const inputs = await genTxAuthInputs(emailFilePath)

        console.log("inputs", inputs)
    });
});
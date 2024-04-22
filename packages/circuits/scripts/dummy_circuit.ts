/**
 *
 * This script is for generating input for the dummy circuit.
 *
 */

import { program } from "commander";
import fs from "fs";
import { promisify } from "util";
import path from "path";
import { genTxAuthInputs } from "../helpers/tx_auth";
const snarkjs = require("snarkjs");

program
  .requiredOption("--input-file <string>", "Path of a json file to write the generated input")
  .option("--silent", "No console logs")
  .option("--prove", "Also generate proof");

program.parse();
const args = program.opts();

function log(...message: any) {
  if (!args.silent) {
    console.log(...message);
  }
}

async function generate() {
  if (!args.inputFile.endsWith(".json")) {
    throw new Error("--input-file path arg must end with .json");
  }

  log("Generating Inputs for:", args);

  const circuitInputs = { in: [1, 2] };
  log("\n\nGenerated Inputs:", circuitInputs, "\n\n");

  await promisify(fs.writeFile)(args.inputFile, JSON.stringify(circuitInputs, null, 2));

  log("Inputs written to", args.inputFile);

  if (args.prove) {
    const dir = path.dirname(args.inputFile);
    const { proof, publicSignals } = await snarkjs.groth16.fullProve(
      circuitInputs,
      path.join(dir, "dummy_circuit/dummy_circuit_js/dummy_circuit.wasm"),
      path.join(dir, "dummy_circuit.zkey"),
      console
    );
    await promisify(fs.writeFile)(path.join(dir, "dummy_circuit_proof.json"), JSON.stringify(proof, null, 2));
    await promisify(fs.writeFile)(path.join(dir, "dummy_circuit_public.json"), JSON.stringify(publicSignals, null, 2));
    log("✓ Proof for dummy circuit generated");
  }
  process.exit(0);
}

generate().catch((err) => {
  console.error("Error generating inputs", err);
  process.exit(1);
});

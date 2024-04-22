import fs from "fs";
import path from "path";
import { program } from "commander";
import { generateKeys } from "./dev-setup";
import { genTxAuthInputs } from "../helpers/tx_auth";

program
  .requiredOption("--output <string>", "Path to the directory storing output files")
  .option("--silent", "No console logs");

program.parse();
export const args = program.opts();

export function log(...message: any) {
  if (!args.silent) {
    console.log(...message);
  }
}

export async function setupTxAuthCircuit() {
  const buildDir = args.output;
  const TxAuthR1csPath = path.join(buildDir, "tx_auth/tx_auth.r1cs");
  const phase1Path = path.join(buildDir, "powersOfTau28_hez_final_22.ptau");

  if (!fs.existsSync(TxAuthR1csPath)) {
    throw new Error(`${TxAuthR1csPath} does not exist.`);
  }
  await generateKeys(
    phase1Path,
    TxAuthR1csPath,
    path.join(buildDir, "tx_auth.zkey"),
    path.join(buildDir, "tx_auth.vkey"),
    path.join(buildDir, "TxAuthVerifier.sol")
  );
  log("✓ Keys for tx auth circuit generated");
}

setupTxAuthCircuit().catch((err) => {
  console.error("Error setting up circuits", err);
  process.exit(1);
});

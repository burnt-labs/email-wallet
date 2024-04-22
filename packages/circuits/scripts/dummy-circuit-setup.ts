import fs from "fs";
import path from "path";
import { program } from "commander";
import { generateKeys } from "./dev-setup";

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

async function setupDummyCircuit() {
  const buildDir = args.output;
  const phase1Path = path.join(buildDir, "powersOfTau28_hez_final_22.ptau");

  const DummyCircuitR1csPath = path.join(buildDir, "dummy_circuit/dummy_circuit.r1cs");
  if (!fs.existsSync(DummyCircuitR1csPath)) {
    throw new Error(`${DummyCircuitR1csPath} does not exist.`);
  }
  await generateKeys(
    phase1Path,
    DummyCircuitR1csPath,
    path.join(buildDir, "dummy_circuit.zkey"),
    path.join(buildDir, "dummy_circuit.vkey"),
    path.join(buildDir, "dummy_circuit.sol")
  );
  log("✓ Keys for tx auth circuit generated");
}

setupDummyCircuit().catch((err) => {
  console.error("Error setting up circuits", err);
  process.exit(1);
});

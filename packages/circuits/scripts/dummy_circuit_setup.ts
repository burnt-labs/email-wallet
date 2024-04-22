import fs from "fs";
import path from "path";
import { program } from "commander";
import { downloadPhase1, generateKeys } from "./dev-setup";

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
  await downloadPhase1(phase1Path);

  const DummyCircuitR1csPath = path.join(buildDir, "dummy_circuit/dummy_circuit.r1cs");
  if (!fs.existsSync(DummyCircuitR1csPath)) {
    throw new Error(`${DummyCircuitR1csPath} does not exist.`);
  }
  await generateKeys(
    phase1Path,
    DummyCircuitR1csPath,
    path.join(buildDir, "dummy_circuit.zkey"),
    path.join(buildDir, "dummy_circuit.vkey"),
    path.join(buildDir, "dummy_circuit.sol"),
  );
  log("✓ Keys for dummy circuit generated");
}

setupDummyCircuit()
  .then(() => {
    log("✓ Dummy circuit setup completed");
    process.exit(0);
  })
  .catch((err) => {
    log("✘ Dummy circuit setup failed");
    console.error(err);
    process.exit(1);
  });

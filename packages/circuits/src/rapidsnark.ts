import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { Circomkit } from 'circomkit';

const execAsync = promisify(exec);

export async function proveWithRapidsnark(
  zkeyPath: string,
  witnessPath: string,
  proofPath: string,
  publicPath: string
): Promise<void> {
  const rapidsnarkPath = path.join(__dirname, '../../rapidsnark/build/prover');

  try {
    await execAsync(`${rapidsnarkPath} ${zkeyPath} ${witnessPath} ${proofPath} ${publicPath}`);
  } catch (error) {
    console.error('Error executing rapidsnark:', error);
    throw error;
  }
}

export async function prove(circuitName?: string, inputName: string = 'default') {
  const circomkit = new Circomkit({ verbose: true });

  // If no circuit name provided, try to get from process.argv
  if (!circuitName) {
    circuitName = process.argv[2];
  }

  // Still need circuit name one way or another
  if (!circuitName) {
    console.error('Please provide a circuit name');
    process.exit(1);
  }

  const buildDir = path.join(__dirname, '../build', circuitName);
  const zkeyPath = path.join(buildDir, `groth16_pkey.zkey`);
  const witnessPath = path.join(buildDir, `${inputName}/witness.wtns`);
  const proofPath = path.join(buildDir, `${inputName}/proof.json`);
  const publicPath = path.join(buildDir, `${inputName}/public.json`);

  console.log('Generating witness...');
  await circomkit.witness(circuitName, inputName);

  console.log('Generating proof with rapidsnark...');
  await proveWithRapidsnark(zkeyPath, witnessPath, proofPath, publicPath);

  console.log('Proof generation complete');
}
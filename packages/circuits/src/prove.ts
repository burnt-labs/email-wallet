import { Circomkit } from 'circomkit';
import { proveWithRapidsnark } from './rapidsnark';
import path from 'path';

async function main() {
  const circomkit = new Circomkit({ verbose: true });
  const circuitName = process.argv[2];
  const inputName = process.argv[3] || 'default';

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

main().catch(console.error);
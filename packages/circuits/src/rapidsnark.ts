import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

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
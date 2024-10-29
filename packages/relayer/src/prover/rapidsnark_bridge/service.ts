import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { readFileSync, writeFile } from 'fs';
import { RAPIDSNARK_BINARY_PATH } from './constants';

const execAsync = promisify(exec);

export interface ProofPaths {
  zkeyPath: string;
  witnessPath: string;
  proofPath: string;
  publicPath: string;
}

export class RapidsnarkProver {
  private buildDir: string;

  constructor(buildDir?: string) {
    this.buildDir = buildDir || path.join(__dirname, '../build');
  }

  private async proveWithRapidsnark(
    zkeyPath: string,
    witnessPath: string,
    proofPath: string,
    publicPath: string
  ): Promise<void> {
    
    try {
      await execAsync(`${RAPIDSNARK_BINARY_PATH} ${zkeyPath} ${witnessPath} ${proofPath} ${publicPath}`);
    } catch (error) {
      console.error('Error executing rapidsnark:', error);
      throw error;
    }
  }

  public getProofPaths(circuitName: string, inputName: string = 'default'): ProofPaths {
    const circuitBuildDir = path.join(this.buildDir, circuitName);
    return {
      zkeyPath: path.join(circuitBuildDir, `groth16_pkey.zkey`),
      witnessPath: path.join(circuitBuildDir, `${inputName}/witness.wtns`),
      proofPath: path.join(circuitBuildDir, `${inputName}/proof.json`),
      publicPath: path.join(circuitBuildDir, `${inputName}/public.json`)
    };
  }

  public async proveWithPaths(paths: ProofPaths): Promise<void> {
    console.log('Generating proof with rapidsnark...');
    await this.proveWithRapidsnark(paths.zkeyPath, paths.witnessPath, paths.proofPath, paths.publicPath);
    console.log('Proof generation complete');
  }

  public async prove(circuitName: string, inputName: string = 'default'): Promise<void> {
    if (!circuitName) {
      throw new Error('Circuit name is required');
    }

    console.log('Generating witness...');
    const circuitBuildDir = path.join(this.buildDir, circuitName);
    const wasmPath = path.join(circuitBuildDir, `${circuitName}_js/${circuitName}.wasm`);
    const inputPath = path.join(circuitBuildDir, `${inputName}/input.json`);
    const witnessPath = path.join(circuitBuildDir, `${inputName}/witness.wtns`);

    // Generate witness using wasm
    const witnessCalculator = require(path.join(circuitBuildDir, `${circuitName}_js/witness_calculator.js`));
    const input = JSON.parse(readFileSync(inputPath, 'utf8'));
    const wasmBuffer = readFileSync(wasmPath);
    
    const calculator = await witnessCalculator(wasmBuffer);
    const witnessBuff = await calculator.calculateWTNSBin(input, 0);
    await new Promise((resolve, reject) => {
      writeFile(witnessPath, witnessBuff, (err) => {
        if (err) reject(err);
        else resolve(undefined);
      });
    });

    const paths = this.getProofPaths(circuitName, inputName);
    await this.proveWithPaths(paths);
  }
}

// Export a default instance for backwards compatibility
export const defaultProver = new RapidsnarkProver();
export const prove = defaultProver.prove.bind(defaultProver);
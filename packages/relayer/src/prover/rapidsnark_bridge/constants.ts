import { join } from 'path';

// Assuming rapidsnark package is installed in node_modules
export const RAPIDSNARK_BINARY_PATH = join(require.resolve('@rapidsnark/prover'), "bin/prover");

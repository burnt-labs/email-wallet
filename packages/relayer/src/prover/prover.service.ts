import { Injectable } from '@nestjs/common';
import { generateEmailVerifierInputs } from '@zk-email/helpers';
import * as snarkjs from 'snarkjs';
import * as path from 'path';
const headerOnlyGenerateWitness = require('../circuits/tx_auth_header_only/generate_witness');
import * as fs from 'fs';

type TxAuthCircuitInput = {
    emailHeader: string[];
    emailHeaderLength: string;
    pubkey: string[];
    signature: string[];
    txBodyIdx: string;
    senderEmailIdx: string;
    emailSaltIdx: string;
};

const EMAIL_HEADER_MAX_BYTES = 1024;

@Injectable()
export class ProverService {

    async generateInputs(
        emailRaw: string
    ): Promise<{ inputs: TxAuthCircuitInput, txBody: string, salt: string }> {
        const emailInputs = await generateEmailVerifierInputs(emailRaw, {
            ignoreBodyHashCheck: true,
            maxHeadersLength: EMAIL_HEADER_MAX_BYTES,
        });

        const data = emailInputs.emailHeader!.map((x) => Number(x));

        // get index of all `#` in data using modern array methods
        const idx = data.flatMap((e, i) => e === 35 ? [i] : []);

        const txBodyIdx = idx[0] + 1;
        const emailSaltIdx = idx[1] + 1;

        const selectorBuffer = Buffer.from("from:");
        const dataBuffer = Buffer.from(data);
        const fromIndex = dataBuffer.indexOf(selectorBuffer);
        const startIndex = fromIndex + selectorBuffer.length;
        const slicedData = dataBuffer.subarray(startIndex);
        const ltIndex = slicedData.indexOf(Buffer.from("<"));
        const senderEmailIdx = startIndex + ltIndex + 1;

        const inputs: TxAuthCircuitInput = {
            ...emailInputs,
            txBodyIdx: txBodyIdx.toString(),
            emailSaltIdx: emailSaltIdx.toString(),
            senderEmailIdx: senderEmailIdx.toString(),
        };

        const txBody = dataBuffer.subarray(txBodyIdx, idx[1]).toString();
        const salt = dataBuffer.subarray(emailSaltIdx, idx[2] || dataBuffer.length).toString();

        return {
            inputs,
            txBody,
            salt
        };
    }

    async generateWitness(inputs: TxAuthCircuitInput) {
        const wasmPath = path.join(__dirname, '..', 'circuits', 'tx_auth_header_only', 'tx_auth_header_only.wasm');
        const randomId = Math.random().toString(36).substring(2, 15);
        const witnessPath = path.join(__dirname, '..', '..', 'tmp', `witness-${randomId}.wtns`);
        await fs.promises.mkdir(path.join(__dirname, '..', '..', 'tmp'), { recursive: true });
        const witness = await headerOnlyGenerateWitness(
            wasmPath,
            inputs,
            witnessPath
        );
        return {
            witness,
            witnessPath
        };
    }

    async generateProof(witnessPath: string) {
        const zkeyPath = path.join(__dirname, '..', 'circuits', 'tx_auth_header_only', 'groth16_pkey.zkey');
        const proof = await snarkjs.groth16.prove(zkeyPath, witnessPath);
        return proof;
    }

    async fullProve(emailRaw: string) {
        const { inputs, txBody, salt } = await this.generateInputs(emailRaw);
        const { witnessPath } = await this.generateWitness(inputs);
        const { proof, publicSignals } = await this.generateProof(witnessPath);
        return { proof, publicSignals, txBody, salt };
    }
}
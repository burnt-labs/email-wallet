import { Injectable } from '@nestjs/common';
import { generateEmailVerifierInputs } from '@zk-email/helpers';
import * as path from 'path';
const headerOnlyGenerateWitness = require('../circuits/tx_auth_header_only/generate_witness');

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

    async getInputsFromHeaderOnlyRawEmail(
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
        const salt = dataBuffer.subarray(emailSaltIdx).toString();

        return {
            inputs,
            txBody,
            salt
        };
    }

    async generateWitness(inputs: TxAuthCircuitInput) {
        const wasmPath = path.join(__dirname, '..', 'circuits', 'tx_auth_header_only', 'tx_auth_header_only.wasm');
        const witness = await headerOnlyGenerateWitness(
            wasmPath,
            inputs,
            "./data.wtns" // don't save the witness to a file
        );
        return witness;
    }
}

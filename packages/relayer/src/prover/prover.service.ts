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
    ): Promise<TxAuthCircuitInput> {
        const emailInputs = await generateEmailVerifierInputs(emailRaw, {
            ignoreBodyHashCheck: true,
            maxHeadersLength: EMAIL_HEADER_MAX_BYTES,
        });

        const data = emailInputs.emailHeader!.map((x) => Number(x));

        // get index of all `#` in data
        const idx = data.reduce((a: number[], e, i) => {
            if (e === 35) a.push(i);
            return a;
        }, []);

        const txBodyIdx = idx[0] + 1;
        const emailSaltIdx = idx[1] + 1;

        const selectorBuffer = Buffer.from("from:");
        let senderEmailIdx =
            Buffer.from(data).indexOf(selectorBuffer) + selectorBuffer.length;
        senderEmailIdx =
            Buffer.from(data).slice(senderEmailIdx).indexOf(Buffer.from("<")) +
            senderEmailIdx +
            1;

        const inputs: TxAuthCircuitInput = {
            ...emailInputs,
            txBodyIdx: txBodyIdx.toString(),
            emailSaltIdx: emailSaltIdx.toString(),
            senderEmailIdx: senderEmailIdx.toString(),
        };

        return inputs;
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

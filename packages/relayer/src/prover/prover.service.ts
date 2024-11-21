import { Injectable } from '@nestjs/common';
import { TxAuthCircuitInput } from './circuits/tx_auth_header_only/generate_input';
import { generateEmailVerifierInputs } from '@zk-email/helpers';

@Injectable()
export class ProverService {
    EMAIL_HEADER_MAX_BYTES = 1024;

    async getInputsFromRawEmail(
        emailRaw: string
    ): Promise<TxAuthCircuitInput> {
        const emailInputs = await generateEmailVerifierInputs(emailRaw, {
            ignoreBodyHashCheck: true,
            maxHeadersLength: this.EMAIL_HEADER_MAX_BYTES,
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
}
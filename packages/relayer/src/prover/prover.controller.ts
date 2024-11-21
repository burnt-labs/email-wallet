import { Controller, Post, Body } from '@nestjs/common';
import { ProverService } from './prover.service';

@Controller('prover')
export class ProverController {
  constructor(private readonly proverService: ProverService) { }

  @Post('signAndSend')
  async signAndSend(@Body() body: { emailRaw: string }) {
    if (!body || !body.emailRaw) {
      throw new Error('Request body must contain emailRaw field');
    }

    const emailRaw = body.emailRaw;
    // prepare the email raw data for the prover
    const inputs = await this.proverService.getInputsFromRawEmail(emailRaw);

    return inputs
  }
}

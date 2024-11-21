import { Controller, Post, Body } from '@nestjs/common';
import { ProverService } from './prover.service';

@Controller('prover')
export class ProverController {
  constructor(private readonly proverService: ProverService) { }

  @Post('signAndSendHeaderOnly')
  async signAndSendHeaderOnly(@Body() body: { emailRaw: string }) {
    if (!body || !body.emailRaw) {
      throw new Error('Request body must contain emailRaw field');
    }
    const inputs = await this.proverService.getInputsFromHeaderOnlyRawEmail(body.emailRaw);
    const witness = await this.proverService.generateWitness(inputs);
    return witness;
  }
}

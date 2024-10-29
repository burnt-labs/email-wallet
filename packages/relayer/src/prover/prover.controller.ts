import { Controller, Post, Body } from '@nestjs/common';

@Controller('prover')
export class ProverController {

  @Post('signAndSend')
  signAndSend(@Body() body: { emailRaw: string }) {
    if (!body || !body.emailRaw) {
      throw new Error('Request body must contain emailRaw field');
    }

    const emailRaw = body.emailRaw;
    
  }
}

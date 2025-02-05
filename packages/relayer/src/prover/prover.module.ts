import { Module } from '@nestjs/common';
import { ProverService } from './prover.service';
import { ProverController } from './prover.controller';

@Module({
  providers: [ProverService],
  controllers: [ProverController]
})
export class ProverModule {}

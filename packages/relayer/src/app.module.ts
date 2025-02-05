import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ProverModule } from './prover/prover.module';

@Module({
  imports: [ProverModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

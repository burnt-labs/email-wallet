import { Test, TestingModule } from '@nestjs/testing';
import { ProverController } from './prover.controller';
import { ProverService } from './prover.service';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('ProverController', () => {
  let controller: ProverController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProverController],
      providers: [ProverService],
    }).compile();

    controller = module.get<ProverController>(ProverController);
  });

  it("should generate proof, public signals, tx body, and salt", async () => {
    const emailRaw = readFileSync(join(__dirname, '__fixtures__/header_only.eml'), 'utf-8');
    const result = await controller.signAndSendHeaderOnly({ emailRaw });

    expect(result.proof).toBeDefined();
    expect(result.publicSignals).toBeDefined();
    expect(result.txBody).toBeDefined();
    expect(result.salt).toBeDefined();
  }, 100000);

  afterAll(async () => {
    await new Promise(resolve => setTimeout(resolve, 500));
  });
});

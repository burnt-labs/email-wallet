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

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it("should receive email raw data", async () => {
    const emailRaw = readFileSync(join(__dirname, '__fixtures__/header_only.eml'), 'utf-8');
    const expected = readFileSync(join(__dirname, '__fixtures__/outputs/header_only.json'), 'utf-8');
    const result = await controller.signAndSend({ emailRaw });
    expect(result).toEqual(JSON.parse(expected));
  });
});

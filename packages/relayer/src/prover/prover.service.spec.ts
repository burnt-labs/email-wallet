import { Test, TestingModule } from '@nestjs/testing';
import { ProverService } from './prover.service';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('ProverService', () => {
  let service: ProverService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProverService],
    }).compile();

    service = module.get<ProverService>(ProverService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it("should generate the correct inputs, extract tx body and salt", async () => {
    const emailRaw = readFileSync(join(__dirname, '__fixtures__/header_only.eml'), 'utf-8');
    const result = await service.generateInputs(emailRaw);
    const expectedInputs = JSON.parse(readFileSync(join(__dirname, '__fixtures__/outputs/header_only.json'), 'utf-8'));
    expect(result.inputs).toEqual(expectedInputs);
    expect(result.txBody).toBeDefined();
    expect(result.salt).toBeDefined();
  });

});

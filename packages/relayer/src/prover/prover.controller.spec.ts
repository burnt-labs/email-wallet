import { Test, TestingModule } from '@nestjs/testing';
import { ProverController } from './prover.controller';

describe('ProverController', () => {
  let controller: ProverController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProverController],
    }).compile();

    controller = module.get<ProverController>(ProverController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { WebhockController } from './webhock.controller';

describe('WebhockController', () => {
  let controller: WebhockController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WebhockController],
    }).compile();

    controller = module.get<WebhockController>(WebhockController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

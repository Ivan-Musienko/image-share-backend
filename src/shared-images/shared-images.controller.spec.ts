import { Test, TestingModule } from '@nestjs/testing';
import { SharedImagesController } from './shared-images.controller';
import { SharedImagesService } from './shared-images.service';

describe('SharedImagesController', () => {
  let controller: SharedImagesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SharedImagesController],
      providers: [SharedImagesService],
    }).compile();

    controller = module.get<SharedImagesController>(SharedImagesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

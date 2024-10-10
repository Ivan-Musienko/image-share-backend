import { Test, TestingModule } from '@nestjs/testing';
import { SharedImagesService } from './shared-images.service';

describe('SharedImagesService', () => {
  let service: SharedImagesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SharedImagesService],
    }).compile();

    service = module.get<SharedImagesService>(SharedImagesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

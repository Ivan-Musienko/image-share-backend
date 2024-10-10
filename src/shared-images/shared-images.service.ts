import { BadRequestException, Injectable } from '@nestjs/common';
import { ImageKitService } from 'imagekit-nestjs';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { Repository } from 'typeorm';
import { SharedImage } from './entities/shared-image.entity';
import { InjectRepository } from '@nestjs/typeorm';
@Injectable()
export class SharedImagesService {
  constructor(
    private readonly imageKitService: ImageKitService,
    private readonly configService: ConfigService,
    @InjectRepository(SharedImage)
    readonly sharedImagesRepo: Repository<SharedImage>,
  ) {}

  async uploadSharedImage(
    file: Express.Multer.File,
  ): Promise<{ Url: string; Uuid: string; FileName: string }> {
    const UUID = randomUUID();
    const { fileId, name } = await this.imageKitService.upload({
      folder: this.configService.get('IMAGEKIT_SHARED_FOLDER'),
      file: file.buffer,
      fileName: `${UUID}.png`,
    });
    return {
      Url: `${this.configService.get('DOMAIN_PROTOCOL')}://${this.configService.get('DOMAIN_URL')}/api/shared-images/image/${fileId}`,
      FileName: name,
      Uuid: fileId,
    };
  }

  findOneByUUID(uuid: string) {
    return this.sharedImagesRepo.findOne({
      where: { Uuid: uuid },
      relations: {
        Author: true,
      },
    });
  }

  async deleteSharedImageById(uuid: string) {
    try {
      await this.imageKitService.deleteFile(uuid);
      return this.sharedImagesRepo.delete({ Uuid: uuid });
    } catch (error) {
      throw new BadRequestException('Image not exists');
    }
  }
}

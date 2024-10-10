import {
  Controller,
  Get,
  Post,
  Param,
  Delete,
  UseGuards,
  Req,
  UseInterceptors,
  HttpStatus,
  ParseFilePipeBuilder,
  UploadedFile,
  BadRequestException,
  ForbiddenException,
  Res,
  NotFoundException,
} from '@nestjs/common';
import { SharedImagesService } from './shared-images.service';
import { AccessTokenGuard } from 'guards/accessToken.guard';
import { Request, Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { InjectRepository } from '@nestjs/typeorm';
import { SharedImage } from './entities/shared-image.entity';
import { Repository } from 'typeorm';
import { User } from 'src/user/entities/user.entity';
import { ImageKitService } from 'imagekit-nestjs';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Controller('shared-images')
export class SharedImagesController {
  constructor(
    private readonly sharedImagesService: SharedImagesService,
    @InjectRepository(SharedImage)
    private sharedImageRepo: Repository<SharedImage>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
    private readonly imageKitService: ImageKitService,
    private readonly configService: ConfigService,
  ) {}

  @UseInterceptors(FileInterceptor('Image'))
  @UseGuards(AccessTokenGuard)
  @Post()
  async create(
    @Req() request: Request,
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addFileTypeValidator({
          fileType: /jpeg|png|jpg/,
        })
        .addMaxSizeValidator({
          maxSize: 1024 * 1024 * 100,
        })
        .build({
          errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        }),
    )
    file: Express.Multer.File,
  ) {
    const user = request.user as Omit<User, 'Password'>;
    const userInDataBase = await this.userRepo.findOneBy({ Id: user.Id });
    const uploadedImage =
      await this.sharedImagesService.uploadSharedImage(file);

    return this.sharedImageRepo.save({
      Uuid: uploadedImage.Uuid,
      Url: uploadedImage.Url,
      FileName: uploadedImage.FileName,
      Author: userInDataBase,
    });
  }

  @UseGuards(AccessTokenGuard)
  @Get('image/:uuid')
  async getSharedImage(@Param('uuid') uuid: string, @Res() res: Response) {
    const image = await this.sharedImagesService.findOneByUUID(uuid);

    if (!image) throw new NotFoundException();

    const url = this.imageKitService.url({
      path:
        this.configService.get('IMAGEKIT_SHARED_FOLDER') + '/' + image.FileName,
    });

    const downloadedImage = await axios.get(url, {
      responseType: 'stream',
    });

    downloadedImage.data.pipe(res);
  }

  @UseGuards(AccessTokenGuard)
  @Get(':uuid')
  findOne(@Param('uuid') uuid: string) {
    return this.sharedImagesService.findOneByUUID(uuid);
  }

  @UseGuards(AccessTokenGuard)
  @Delete(':uuid')
  async remove(@Param('uuid') uuid: string, @Req() request: Request) {
    const sharedImage = await this.sharedImageRepo.findOne({
      where: { Uuid: uuid },
      relations: {
        Author: true,
      },
    });
    if (!sharedImage) throw new BadRequestException('Image not exists');

    const user = request.user as Omit<User, 'Password'>;
    if (user.Id !== sharedImage.Author.Id) throw new ForbiddenException();

    return this.sharedImagesService.deleteSharedImageById(uuid);
  }
}

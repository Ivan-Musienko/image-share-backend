import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Req,
  ForbiddenException,
  Res,
  Patch,
  HttpStatus,
  ParseFilePipeBuilder,
  UploadedFile,
  UseInterceptors,
  UnprocessableEntityException,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AccessTokenGuard } from '../../guards/accessToken.guard';
import { Request, Response } from 'express';
import { User } from './entities/user.entity';
import { AuthService } from 'src/auth/auth.service';
import { JwtAuth } from 'src/auth/entities/jwt-auth.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FileInterceptor } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { ImageKitService } from 'imagekit-nestjs';

@Controller('user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    @InjectRepository(JwtAuth) private jwtAuthRepo: Repository<JwtAuth>,
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
    private readonly imageKitService: ImageKitService,
  ) {}

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  @UseGuards(AccessTokenGuard)
  @Get()
  async findOne(@Req() req: Request) {
    const user = req.user as User;
    const findedUser = await this.userService.findOneById(user.Id);

    if (findedUser.Id !== user.Id) throw new ForbiddenException();

    return findedUser;
  }

  @UseInterceptors(FileInterceptor('Avatar'))
  @UseGuards(AccessTokenGuard)
  @Patch()
  async update(
    @Body() updateUserDto: UpdateUserDto,
    @Req() request: Request,
    @Res() res: Response,
    @UploadedFile()
    file: Express.Multer.File,
  ) {
    const user = request.user as User;
    delete updateUserDto['Email'];
    delete updateUserDto['Password'];

    const body = { ...updateUserDto };
    if (file) {
      const parseFilePipe = new ParseFilePipeBuilder()
        .addFileTypeValidator({
          fileType: /jpeg|png|jpg/,
        })
        .addMaxSizeValidator({
          maxSize: 1024 * 1024,
        })
        .build({
          errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        });

      try {
        await parseFilePipe.transform(file);
      } catch (error) {
        throw new UnprocessableEntityException();
      }
      const avatarBuffer = { image: file.buffer };
      const avatar = await this.imageKitService.upload({
        file: avatarBuffer.image,
        fileName: `${randomUUID()}.png`,
        folder: this.configService.get('IMAGEKIT_AVATARS_FOLDER'),
      });
      body.Avatar = avatar.url;
    }
    const updatedUser = await this.userService.update(user.Id, body);

    const [AccessToken, RefreshToken] =
      await this.authService.generateTokens(updatedUser);

    const { headers } = request;

    const userAgent = headers['user-agent'];

    await this.jwtAuthRepo.delete({ Refresh: request.cookies.RefreshToken });

    await this.jwtAuthRepo.save({
      Sub: updatedUser.Id,
      Access: AccessToken,
      Refresh: RefreshToken,
      UserAgent: userAgent,
    });
    this.authService.setAuthCookies(res, RefreshToken, AccessToken);
    res.json({ RefreshToken, AccessToken });
  }
}

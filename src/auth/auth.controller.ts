import {
  Controller,
  Post,
  Body,
  UnauthorizedException,
  Res,
  UseGuards,
  HttpCode,
  Get,
  Req,
  UseInterceptors,
  UploadedFile,
  ParseFilePipeBuilder,
  HttpStatus,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignUpAuthDto } from './dto/signup-auth.dto';
import { User } from '../../src/user/entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Request, Response } from 'express';
import { SignInAuthDto } from './dto/signin-auth.dto';
import { JwtAuth } from './entities/jwt-auth.entity';
import { RefreshTokenGuard } from '../../guards/refreshToken.guard';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { GoogleGuard } from '../../guards/google.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { randomUUID } from 'crypto';
import { ImageKitService } from 'imagekit-nestjs';
import { UiAvatarsService } from 'nestjs-ui-avatars';
import axios from 'axios';
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(JwtAuth) private jwtAuthRepo: Repository<JwtAuth>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly imageKitService: ImageKitService,
    private readonly uiAvatarsService: UiAvatarsService,
  ) {}

  @UseGuards(GoogleGuard)
  @Get('google')
  startGoogleCallback() {}

  @UseGuards(GoogleGuard)
  @Get('google/callback')
  async handleGoogleCallback(@Req() req: Request, @Res() res: Response) {
    const requestUser = req.user as Pick<
      User,
      'Email' | 'FirstName' | 'Avatar' | 'LastName'
    >;

    let user = await this.userRepo.findOne({
      where: { Email: requestUser.Email },
      select: [
        'Email',
        'Avatar',
        'Password',
        'FirstName',
        'Id',
        'LastName',
        'Provider',
      ],
    });
    if (!user) {
      const avatarBuffer = await axios.get(requestUser.Avatar, {
        responseType: 'arraybuffer',
      });

      const avatar = await this.imageKitService.upload({
        file: avatarBuffer.data,
        fileName: `${randomUUID()}.png`,
        folder: this.configService.get('IMAGEKIT_AVATARS_FOLDER'),
      });

      user = await this.authService.createUserOAUTH({
        ...req.user,
        Avatar: avatar.url,
      } as SignUpAuthDto);
    } else {
      if (user && user.Provider !== 'GOOGLE')
        throw new UnauthorizedException('Try another signin variant');
    }
    const [AccessToken, RefreshToken] =
      await this.authService.generateTokens(user);

    const { headers } = req;

    const userAgent = headers['user-agent'];

    await this.jwtAuthRepo.save({
      Sub: user.Id,
      Access: AccessToken,
      Refresh: RefreshToken,
      UserAgent: userAgent,
    });
    this.authService.setAuthCookies(res, RefreshToken, AccessToken);
    res.redirect('https://9d8f-193-107-107-19.ngrok-free.app/account');
  }

  @UseGuards(RefreshTokenGuard)
  @Get('logout')
  async logout(@Req() req: Request, @Res() res: Response) {
    const refreshToken = req.cookies.RefreshToken;

    await this.jwtAuthRepo.delete({ Refresh: refreshToken });

    res.clearCookie('AccessToken');
    res.clearCookie('RefreshToken');

    res.json({
      ok: 1,
    });
  }

  @UseInterceptors(FileInterceptor('Avatar'))
  @Post('signup')
  async signupByJWT(
    @Body() signUpAuthDto: SignUpAuthDto,
    @Res() res: Response,
    @Req() req: Request,
    @UploadedFile()
    file?: Express.Multer.File,
  ) {
    const findUser = await this.userRepo.findOne({
      where: { Email: signUpAuthDto.Email },
      select: [
        'Email',
        'Avatar',
        'Password',
        'FirstName',
        'Id',
        'LastName',
        'Provider',
      ],
    });
    if (findUser) throw new UnauthorizedException('User exists');

    const passwd = signUpAuthDto.Password;

    const encryptedPasswd = await bcrypt.hash(passwd, 13);

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

      parseFilePipe.transform(file);
    }

    const avatarBuffer = file
      ? { image: file.buffer }
      : await this.uiAvatarsService.downloadAvatar({
          name: signUpAuthDto.FirstName,
        });
    const avatar = await this.imageKitService.upload({
      file: avatarBuffer.image,
      fileName: `${randomUUID()}.png`,
      folder: this.configService.get('IMAGEKIT_AVATARS_FOLDER'),
    });
    const user = await this.authService.createUserJWT({
      ...signUpAuthDto,
      Avatar: avatar.url,
      Password: encryptedPasswd,
    });
    const [AccessToken, RefreshToken] =
      await this.authService.generateTokens(user);

    const { headers } = req;

    const userAgent = headers['user-agent'];

    await this.jwtAuthRepo.save({
      Sub: user.Id,
      Access: AccessToken,
      Refresh: RefreshToken,
      UserAgent: userAgent,
    });
    this.authService.setAuthCookies(res, RefreshToken, AccessToken);

    res.json({ RefreshToken, AccessToken });
  }

  @Post('signin')
  async signinByJwt(
    @Res() res: Response,
    @Body() body: SignInAuthDto,
    @Req() req: Request,
  ) {
    const findedUser = await this.userRepo.findOne({
      where: { Email: body.Email },
      select: [
        'Email',
        'Avatar',
        'Password',
        'FirstName',
        'Id',
        'LastName',
        'Provider',
      ],
    });

    if (!findedUser)
      throw new UnauthorizedException('Email or Password not valid');

    if (findedUser && findedUser.Provider !== 'JWT')
      throw new UnauthorizedException('Try another signin variant');

    const fingerprint = body.Password;
    const userPassword = findedUser.Password;

    const comparedPassword = await bcrypt.compare(fingerprint, userPassword);

    if (!comparedPassword)
      throw new UnauthorizedException('Email or Password not valid');

    const [AccessToken, RefreshToken] =
      await this.authService.generateTokens(findedUser);

    const { headers } = req;

    const userAgent = headers['user-agent'];

    await this.jwtAuthRepo.delete({ UserAgent: userAgent });

    await this.jwtAuthRepo.save({
      Sub: findedUser.Id,
      Access: AccessToken,
      Refresh: RefreshToken,
      UserAgent: userAgent,
    });

    this.authService.setAuthCookies(res, RefreshToken, AccessToken);

    res.json({ RefreshToken, AccessToken });
  }

  @HttpCode(201)
  @UseGuards(RefreshTokenGuard)
  @Get('refresh')
  async refreshTokens(@Res() res: Response, @Req() req: Request) {
    if (!req.cookies.RefreshToken)
      throw new UnauthorizedException('Token is required');
    const refreshToken = req.cookies.RefreshToken;
    const verifyToken = this.jwtService.verify(refreshToken, {
      secret: this.configService.get('JWT_REFRESH_SECRET'),
    });
    const findedToken = await this.jwtAuthRepo.findOneBy({
      Refresh: refreshToken,
    });
    if (!findedToken) throw new UnauthorizedException('Token is not valid');

    await this.jwtAuthRepo.delete({ Refresh: refreshToken });
    const findedUser = await this.userRepo.findOne({
      where: { Id: verifyToken.Id },
      select: ['Email', 'Avatar', 'FirstName', 'Id', 'LastName', 'Provider'],
    });

    if (!findedUser) throw new UnauthorizedException('Token is not valid!');

    const [AccessToken, RefreshToken] =
      await this.authService.generateTokens(findedUser);

    const { headers } = req;

    const userAgent = headers['user-agent'];

    await this.jwtAuthRepo.save({
      Sub: findedUser.Id,
      Access: AccessToken,
      Refresh: RefreshToken,
      UserAgent: userAgent,
    });

    this.authService.setAuthCookies(res, RefreshToken, AccessToken);
    res.json({ RefreshToken, AccessToken });
  }

  private createAvatar(file: Express.Multer.File) {
    this.imageKitService.upload({
      file: file.buffer,
      fileName: file.filename,
    });
  }
}

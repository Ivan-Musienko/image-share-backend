import { Injectable } from '@nestjs/common';
import { SignUpAuthDto } from './dto/signup-auth.dto';
import { User } from '../../src/user/entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Response } from 'express';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  createUserJWT(signUpAuthDto: SignUpAuthDto) {
    return this.userRepo.save({ ...signUpAuthDto, Provider: 'JWT' });
  }
  createUserOAUTH(signUpAuthDto: SignUpAuthDto) {
    return this.userRepo.save({ ...signUpAuthDto, Provider: 'GOOGLE' });
  }

  setAuthCookies(res: Response, RefreshToken: string, AccessToken: string) {
    res.cookie('RefreshToken', RefreshToken, {
      httpOnly: true,
      secure: true,
      maxAge: 24 * 60 * 60 * 3000,
      domain: this.configService.get('DOMAIN_URL'),
    });
    res.cookie('AccessToken', AccessToken, {
      httpOnly: true,
      secure: true,
      maxAge: 24 * 60 * 60 * 1000,
      domain: this.configService.get('DOMAIN_URL'),
    });
  }

  /**
   *
   * @param user User model in db
   * @returns [AccessToken,RefreshToken]
   */
  async generateTokens(user: User): Promise<string[]> {
    return await Promise.all([
      this.jwtService.signAsync(
        {
          Email: user.Email,
          FirstName: user.FirstName,
          LastName: user.LastName,
          Avatar: user.Avatar,
          Id: user.Id,
        },
        {
          secret: this.configService.get('JWT_ACCESS_SECRET'),
          expiresIn: this.configService.get('JWT_ACCESS_TIME'),
        },
      ),
      this.jwtService.signAsync(
        {
          Email: user.Email,
          Id: user.Id,
        },
        {
          secret: this.configService.get('JWT_REFRESH_SECRET'),
          expiresIn: this.configService.get('JWT_REFRESH_TIME'),
        },
      ),
    ]);
  }
}

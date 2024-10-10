import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtAuth } from '../src/auth/entities/jwt-auth.entity';
import { UserService } from '../src/user/user.service';
import { Repository } from 'typeorm';
import { Request } from 'express';

@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(
  Strategy,
  'refresh-jwt',
) {
  constructor(
    configService: ConfigService,
    private userService: UserService,
    @InjectRepository(JwtAuth) private jwtAuthRepo: Repository<JwtAuth>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => {
          const refreshToken = req?.cookies?.RefreshToken;
          if (!refreshToken) {
            return null;
          }
          return refreshToken;
        },
      ]),
      secretOrKey: configService.get('JWT_REFRESH_SECRET'),
    });
  }
  async validate(payload: any) {
    const user = await this.userService.findOne(payload.Id);
    return user;
  }
}

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { UserService } from '../src/user/user.service';
import { User } from 'src/user/entities/user.entity';

@Injectable()
export class AccessTokenStrategy extends PassportStrategy(
  Strategy,
  'access-jwt',
) {
  constructor(
    configService: ConfigService,
    private userService: UserService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => {
          const accessToken = req?.cookies?.AccessToken;
          if (!accessToken) {
            return null;
          }
          return accessToken;
        },
      ]),
      secretOrKey: configService.get('JWT_ACCESS_SECRET'),
    });
  }

  async validate(payload): Promise<Omit<User, 'Password'>> {
    const user = await this.userService.findOne(payload.Id);
    if (!user) throw new UnauthorizedException();
    delete user['Password'];
    return user;
  }
}

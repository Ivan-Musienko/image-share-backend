import { forwardRef, Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { User } from '../../src/user/entities/user.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { JwtAuth } from './entities/jwt-auth.entity';
import { RefreshTokenStrategy } from '../../strategies/refreshToken.strategy';
import { UserModule } from '../../src/user/user.module';
import { GoogleStrategy } from '../../strategies/google.strategy';
import { UiAvatarsModule } from 'nestjs-ui-avatars';
import { AccessTokenStrategy } from 'strategies/accessToken.strategy';

@Module({
  controllers: [AuthController],
  providers: [
    AuthService,
    RefreshTokenStrategy,
    GoogleStrategy,
    AccessTokenStrategy,
  ],
  imports: [
    UiAvatarsModule.forRoot({}),
    TypeOrmModule.forFeature([User, JwtAuth]),
    JwtModule,
    forwardRef(() => UserModule),
  ],
  exports: [AuthService],
})
export class AuthModule {}

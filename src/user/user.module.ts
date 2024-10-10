import { forwardRef, Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { AuthModule } from 'src/auth/auth.module';
import { JwtAuth } from 'src/auth/entities/jwt-auth.entity';

@Module({
  controllers: [UserController],
  imports: [
    TypeOrmModule.forFeature([User, JwtAuth]),
    forwardRef(() => AuthModule),
  ],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}

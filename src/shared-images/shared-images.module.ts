import { Module } from '@nestjs/common';
import { SharedImagesService } from './shared-images.service';
import { SharedImagesController } from './shared-images.controller';
import { AccessTokenStrategy } from 'strategies/accessToken.strategy';
import { UserModule } from 'src/user/user.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SharedImage } from './entities/shared-image.entity';
import { User } from 'src/user/entities/user.entity';

@Module({
  controllers: [SharedImagesController],
  imports: [UserModule, TypeOrmModule.forFeature([SharedImage, User])],
  providers: [SharedImagesService, AccessTokenStrategy],
})
export class SharedImagesModule {}

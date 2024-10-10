import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { JwtAuth } from '../src/auth/entities/jwt-auth.entity';
import { User } from '../src/user/entities/user.entity';
import { SharedImage } from 'src/shared-images/entities/shared-image.entity';

export const PostgreSQLConfig = (
  configService: ConfigService,
): TypeOrmModuleOptions => {
  return {
    type: 'postgres',
    host: configService.get('POSTGRESQL_HOST') || 'localhost',
    port: +configService.get('POSTGRESQL_PORT') || 5432,
    username: configService.get('POSTGRESQL_USERNAME'),
    password: configService.get('POSTGRESQL_PASSWORD'),
    database: configService.get('POSTGRESQL_DATABASE'),
    ssl: {
      rejectUnauthorized: true,
      ca: configService.get('POSTGRESQL_CERT'),
    },
    entities: [User, JwtAuth, SharedImage],
    synchronize: true,
  };
};

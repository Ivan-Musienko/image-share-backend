import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtAuth } from '../src/auth/entities/jwt-auth.entity';
import { Repository } from 'typeorm';

@Injectable()
export class RefreshTokenGuard extends AuthGuard('refresh-jwt') {
  constructor(
    @InjectRepository(JwtAuth)
    private readonly jwtAuthRepo: Repository<JwtAuth>,
  ) {
    super();
  }
}

import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  isAlive(): { ok: number } {
    return { ok: 1 };
  }
}

import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller('/')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('webhook')
  getHello(): { ok: number } {
    return this.appService.isAlive();
  }
}

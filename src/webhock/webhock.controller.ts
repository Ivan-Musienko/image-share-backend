import { Controller, Get } from '@nestjs/common';

@Controller('webhock')
export class WebhockController {
  @Get('live')
  isAlive() {
    return {
      ok: 1,
    };
  }
}

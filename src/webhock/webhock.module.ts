import { Module } from '@nestjs/common';
import { WebhockController } from './webhock.controller';

@Module({
  controllers: [WebhockController]
})
export class WebhockModule {}

import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { GroqClientService } from './groq.client';

@Module({
  controllers: [AiController],
  providers: [AiService, GroqClientService],
  exports: [AiService, GroqClientService],
})
export class AiModule {}

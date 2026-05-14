import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { AiService } from './ai.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Throttle } from '@nestjs/throttler';

@Controller('ai')
export class AiController {
  constructor(private aiService: AiService) {}

  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @UseGuards(JwtAuthGuard)
  @Post('writing')
  analyzeWriting(@CurrentUser('id') userId: string, @Body() dto: { essay: string }) {
    return this.aiService.analyzeWriting(userId, dto.essay);
  }

  @Throttle({ default: { limit: 15, ttl: 60000 } })
  @UseGuards(JwtAuthGuard)
  @Post('speaking')
  @UseInterceptors(
    FileInterceptor('audio', {
      storage: memoryStorage(),
      limits: { fileSize: Number(process.env.MAX_SPEAKING_AUDIO_BYTES) || 20 * 1024 * 1024 },
    }),
  )
  analyzeSpeakingUpload(
    @CurrentUser('id') userId: string,
    @UploadedFile() file: Express.Multer.File | undefined,
  ) {
    if (!file?.buffer?.length) {
      throw new BadRequestException('Audio fayl (audio) yuklang');
    }
    return this.aiService.analyzeSpeakingFromAudio(
      userId,
      file.buffer,
      file.originalname || 'recording.webm',
      file.mimetype,
    );
  }

  /** @deprecated Prefer multipart /ai/speaking */
  @Throttle({ default: { limit: 15, ttl: 60000 } })
  @UseGuards(JwtAuthGuard)
  @Post('speaking-text')
  analyzeSpeakingJson(
    @CurrentUser('id') userId: string,
    @Body() dto: { audioUrl?: string; transcript: string },
  ) {
    return this.aiService.analyzeSpeakingFromTranscriptOnly(userId, dto.audioUrl, dto.transcript);
  }

  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @UseGuards(JwtAuthGuard)
  @Get('roadmap')
  generateRoadmap(@CurrentUser('id') userId: string) {
    return this.aiService.generateRoadmap(userId);
  }

  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @UseGuards(JwtAuthGuard)
  @Post('cefr-predict')
  ceFrPrediction(@CurrentUser('id') userId: string, @Body() dto: { text: string }) {
    return this.aiService.ceFrPrediction(userId, dto.text);
  }
}

import {
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { StorageService } from '../storage/storage.service';
import { Throttle } from '@nestjs/throttler';

const paymentUpload = memoryStorage();

@Controller('uploads')
export class UploadsController {
  constructor(private storage: StorageService) {}

  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @UseGuards(JwtAuthGuard)
  @Post('payment-proof')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: paymentUpload,
      limits: { fileSize: Number(process.env.MAX_PAYMENT_IMAGE_BYTES) || 5 * 1024 * 1024 },
    }),
  )
  async uploadPaymentProof(@CurrentUser('id') _userId: string, @UploadedFile() file?: Express.Multer.File) {
    if (!file?.buffer?.length) throw new BadRequestException('Fayl yuklanmadi');
    const saved = await this.storage.savePaymentProof(file.buffer, file.mimetype);
    return { storageKey: saved.storageKey, publicUrl: saved.publicUrl };
  }

  @Throttle({ default: { limit: 15, ttl: 60000 } })
  @UseGuards(JwtAuthGuard)
  @Post('speaking-audio')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: Number(process.env.MAX_SPEAKING_AUDIO_BYTES) || 20 * 1024 * 1024 },
    }),
  )
  async uploadSpeaking(@CurrentUser('id') _userId: string, @UploadedFile() file?: Express.Multer.File) {
    if (!file?.buffer?.length) throw new BadRequestException('Audio yuklanmadi');
    const saved = await this.storage.saveSpeakingAudio(file.buffer, file.mimetype, file.originalname);
    return { storageKey: saved.storageKey, publicUrl: saved.publicUrl };
  }
}

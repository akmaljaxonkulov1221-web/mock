import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { PdfImportController } from './pdf-import.controller';
import { PdfImportService } from './pdf-import.service';
import { AiModule } from '../ai/ai.module';
import { PrismaModule } from '../common/prisma.module';

@Module({
  imports: [
    AiModule,
    PrismaModule,
    MulterModule.register({ limits: { fileSize: 20 * 1024 * 1024 } }), // 20MB
  ],
  controllers: [PdfImportController],
  providers: [PdfImportService],
})
export class PdfImportModule {}

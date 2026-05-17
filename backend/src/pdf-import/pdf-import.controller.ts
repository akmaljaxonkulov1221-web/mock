import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  UseGuards,
  Body,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { PdfImportService } from './pdf-import.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { memoryStorage } from 'multer';

@Controller('pdf-import')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN', 'TEACHER')
export class PdfImportController {
  constructor(private pdfImportService: PdfImportService) {}

  /**
   * PDF faylini yuklash va AI orqali savollar ajratib olish (preview)
   * POST /api/pdf-import/parse
   */
  @Post('parse')
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  async parsePdf(
    @UploadedFile() file: Express.Multer.File,
    @Body('subjectId') subjectId: string,
    @Body('topic') topic: string,
    @Body('difficulty') difficulty: string,
  ) {
    if (!file) throw new BadRequestException('PDF fayl topilmadi');
    if (!file.originalname.toLowerCase().endsWith('.pdf')) {
      throw new BadRequestException("Faqat PDF fayl qabul qilinadi");
    }
    if (!subjectId) throw new BadRequestException('Fan tanlanmagan');

    return this.pdfImportService.parsePdfAndExtractQuestions({
      buffer: file.buffer,
      subjectId,
      topic: topic || 'Umumiy',
      difficulty: difficulty ? parseInt(difficulty, 10) : 2,
    });
  }

  /**
   * AI tomonidan yaratilgan savollarni QuestionBank ga saqlash
   * POST /api/pdf-import/save
   */
  @Post('save')
  async saveQuestions(
    @Body()
    dto: {
      subjectId: string;
      topic: string;
      difficulty: number;
      questions: {
        question: string;
        options: string[];
        answer: string;
        explanation?: string;
      }[];
    },
  ) {
    if (!dto.questions || dto.questions.length === 0) {
      throw new BadRequestException("Savollar ro'yxati bo'sh");
    }
    return this.pdfImportService.saveQuestions(dto);
  }
}

import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { QuestionBankService } from './question-bank.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('question-bank')
export class QuestionBankController {
  constructor(private questionBankService: QuestionBankService) {}

  @Get('subject/:subjectId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'TEACHER')
  findBySubject(
    @Param('subjectId') subjectId: string,
    @Query('topic') topic?: string,
    @Query('difficulty') difficulty?: string,
    @Query('limit') limit?: string,
  ) {
    return this.questionBankService.findBySubject(subjectId, {
      topic,
      difficulty: difficulty ? parseInt(difficulty, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Get('subject/:subjectId/topics')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'TEACHER')
  getTopics(@Param('subjectId') subjectId: string) {
    return this.questionBankService.getTopics(subjectId);
  }

  @Get('subject/:subjectId/stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'TEACHER')
  getStats(@Param('subjectId') subjectId: string) {
    return this.questionBankService.getStats(subjectId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'TEACHER')
  findOne(@Param('id') id: string) {
    return this.questionBankService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'TEACHER')
  create(
    @Body()
    dto: {
      subjectId: string;
      question: string;
      type?: string;
      options?: any;
      answer?: string;
      explanation?: string;
      imageUrl?: string;
      difficulty?: number;
      topic?: string;
    },
  ) {
    return this.questionBankService.create(dto);
  }

  @Post('bulk/:subjectId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'TEACHER')
  createMany(
    @Param('subjectId') subjectId: string,
    @Body()
    dto: {
      items: {
        question: string;
        type?: string;
        options?: any;
        answer?: string;
        explanation?: string;
        imageUrl?: string;
        difficulty?: number;
        topic?: string;
      }[];
    },
  ) {
    return this.questionBankService.createMany(subjectId, dto.items);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'TEACHER')
  update(
    @Param('id') id: string,
    @Body()
    dto: {
      question?: string;
      type?: string;
      options?: any;
      answer?: string;
      explanation?: string;
      imageUrl?: string;
      difficulty?: number;
      topic?: string;
      isActive?: boolean;
    },
  ) {
    return this.questionBankService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  remove(@Param('id') id: string) {
    return this.questionBankService.remove(id);
  }
}

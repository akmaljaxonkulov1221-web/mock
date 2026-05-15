import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ExamsService } from './exams.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('exams')
export class ExamsController {
  constructor(private examsService: ExamsService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('TEACHER', 'CENTER_ADMIN', 'SUPER_ADMIN')
  @Post()
  create(
    @Body()
    dto: {
      title: string;
      type: string;
      duration: number;
      level?: string;
      subjectId?: string;
      requiresPayment?: boolean;
      priceUzs?: number;
      paymentInstructions?: string;
      questions: any[];
    },
    @CurrentUser('id') userId: string,
  ) {
    return this.examsService.create({ ...dto, type: dto.type as any, createdBy: userId });
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(@Query('type') type?: string, @Query('subjectId') subjectId?: string) {
    return this.examsService.findAll(type as any, subjectId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('results/mine')
  getMyResults(@CurrentUser('id') userId: string) {
    return this.examsService.getResults(userId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'CENTER_ADMIN')
  @Get('admin/suspicious-results')
  suspiciousResults() {
    return this.examsService.listSuspiciousResults(80);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.examsService.findOneForUser(id, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/proctor')
  logProctor(
    @Param('id') examId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: { eventType: string; detail?: Record<string, unknown> },
  ) {
    return this.examsService.logProctorEvent(userId, examId, dto.eventType, dto.detail);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/submit')
  submitResult(
    @Param('id') examId: string,
    @Body()
    dto: {
      answers: any;
      score: number;
      cefrLevel?: string;
      integrityScore?: number;
      integrityReport?: Record<string, unknown>;
    },
    @CurrentUser('id') userId: string,
  ) {
    return this.examsService.submitResult({
      userId,
      examId,
      answers: dto.answers,
      score: dto.score,
      cefrLevel: dto.cefrLevel,
      integrityScore: dto.integrityScore,
      integrityReport: dto.integrityReport,
    });
  }
}

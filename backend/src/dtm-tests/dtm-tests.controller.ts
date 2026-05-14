import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { DtmTestsService } from './dtm-tests.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('dtm-tests')
@UseGuards(JwtAuthGuard)
export class DtmTestsController {
  constructor(private dtmTestsService: DtmTestsService) {}

  @Post('sessions')
  createSession(
    @Request() req: any,
    @Body()
    dto: {
      title: string;
      totalDuration?: number;
      blocks: {
        subjectName: string;
        questions: {
          question: string;
          options: string[];
          correctAnswer: number;
        }[];
      }[];
    },
  ) {
    return this.dtmTestsService.createSession(req.user.sub, dto);
  }

  @Post('sessions/from-bank')
  createFromBank(
    @Request() req: any,
    @Body()
    dto: {
      title: string;
      totalDuration?: number;
      blocks: { subjectId: string; subjectName: string; count: number }[];
    },
  ) {
    return this.dtmTestsService.createFromQuestionBank(req.user.sub, dto);
  }

  @Get('sessions')
  getUserSessions(@Request() req: any) {
    return this.dtmTestsService.getUserSessions(req.user.sub);
  }

  @Get('sessions/:sessionId')
  getSession(@Param('sessionId') sessionId: string, @Request() req: any) {
    return this.dtmTestsService.getSession(sessionId, req.user.sub);
  }

  @Post('sessions/:sessionId/blocks/:blockId/submit')
  submitBlock(
    @Param('sessionId') sessionId: string,
    @Param('blockId') blockId: string,
    @Request() req: any,
    @Body() dto: { answers: Record<number, number> },
  ) {
    return this.dtmTestsService.submitBlock(
      sessionId,
      blockId,
      req.user.sub,
      dto.answers,
    );
  }

  @Post('sessions/:sessionId/complete')
  completeSession(
    @Param('sessionId') sessionId: string,
    @Request() req: any,
  ) {
    return this.dtmTestsService.completeSession(sessionId, req.user.sub);
  }

  @Get('admin/sessions')
  @UseGuards(RolesGuard)
  @Roles('SUPER_ADMIN')
  getAllSessions() {
    return this.dtmTestsService.getAdminAllSessions();
  }
}

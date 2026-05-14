import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ManualPaymentsService } from './manual-payments.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('manual-payments')
export class ManualPaymentsController {
  constructor(private manualPayments: ManualPaymentsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(
    @CurrentUser('id') userId: string,
    @Body() body: { examId: string; screenshotKey: string; amountNote?: string },
  ) {
    return this.manualPayments.createRequest(userId, body);
  }

  @UseGuards(JwtAuthGuard)
  @Get('mine')
  mine(@CurrentUser('id') userId: string) {
    return this.manualPayments.listMine(userId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'CENTER_ADMIN')
  @Get('pending')
  pending() {
    return this.manualPayments.listPending();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'CENTER_ADMIN')
  @Post(':id/approve')
  approve(@Param('id') id: string, @CurrentUser('id') reviewerId: string) {
    return this.manualPayments.approve(id, reviewerId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'CENTER_ADMIN')
  @Post(':id/reject')
  reject(@Param('id') id: string, @CurrentUser('id') reviewerId: string, @Body() body: { reason: string }) {
    return this.manualPayments.reject(id, reviewerId, body.reason);
  }
}

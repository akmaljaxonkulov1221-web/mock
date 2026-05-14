import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('payments')
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  @UseGuards(JwtAuthGuard)
  @Post('one-time')
  createOneTimePayment(
    @CurrentUser('id') userId: string,
    @Body()
    dto: {
      examId: string;
      amount: number;
      currency?: string;
      paymentMethod?: string;
      screenshotKey?: string;
    },
  ) {
    return this.paymentsService.createOneTimePayment({ userId, ...dto });
  }

  @UseGuards(JwtAuthGuard)
  @Get('my-payments')
  getUserPayments(@CurrentUser('id') userId: string) {
    return this.paymentsService.getUserPayments(userId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  @Get('pending')
  getAllPendingPayments() {
    return this.paymentsService.getAllPendingPayments();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  @Get('all')
  getAllPayments() {
    return this.paymentsService.getAllPayments();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  @Post(':id/approve')
  approvePayment(
    @Param('id') id: string,
    @CurrentUser('id') reviewerId: string,
  ) {
    return this.paymentsService.approvePayment(id, reviewerId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  @Post(':id/reject')
  rejectPayment(
    @Param('id') id: string,
    @CurrentUser('id') reviewerId: string,
    @Body() dto: { reason?: string },
  ) {
    return this.paymentsService.rejectPayment(id, reviewerId, dto.reason);
  }

  @UseGuards(JwtAuthGuard)
  @Get('subscription')
  getSubscription(@CurrentUser('id') userId: string) {
    return this.paymentsService.getSubscription(userId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  @Get('subscriptions/all')
  getAllSubscriptions() {
    return this.paymentsService.getAllSubscriptions();
  }
}

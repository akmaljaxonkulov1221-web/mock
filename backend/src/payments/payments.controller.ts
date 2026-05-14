import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('payments')
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  @UseGuards(JwtAuthGuard)
  @Get('subscription')
  getSubscription(@CurrentUser('id') userId: string) {
    return this.paymentsService.getSubscription(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('upgrade')
  upgradePlan(@CurrentUser('id') userId: string, @Body() dto: { plan: 'PRO' | 'ENTERPRISE' }) {
    return this.paymentsService.upgradePlan(userId, dto.plan);
  }

  @UseGuards(JwtAuthGuard)
  @Post('cancel')
  cancelSubscription(@CurrentUser('id') userId: string) {
    return this.paymentsService.cancelSubscription(userId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  @Get('subscriptions/all')
  getAllSubscriptions() {
    return this.paymentsService.getAllSubscriptions();
  }
}

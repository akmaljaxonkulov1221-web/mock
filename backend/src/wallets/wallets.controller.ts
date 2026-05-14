import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { WalletsService } from './wallets.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('wallets')
@UseGuards(JwtAuthGuard)
export class WalletsController {
  constructor(private walletsService: WalletsService) {}

  @Get('balance')
  getBalance(@Request() req: any) {
    return this.walletsService.getBalance(req.user.sub);
  }

  @Get('transactions')
  getTransactions(@Request() req: any) {
    return this.walletsService.getTransactions(req.user.sub);
  }

  @Post('top-up')
  topUp(@Request() req: any, @Body() dto: { amount: number; referenceId?: string }) {
    return this.walletsService.topUp(req.user.sub, dto.amount, dto.referenceId);
  }

  @Post('purchase/:examId')
  purchaseExam(@Request() req: any, @Param('examId') examId: string) {
    return this.walletsService.purchaseExam(req.user.sub, examId);
  }

  @Get('admin/all')
  @UseGuards(RolesGuard)
  @Roles('SUPER_ADMIN')
  getAllWallets() {
    return this.walletsService.getAllWallets();
  }

  @Post('admin/top-up/:userId')
  @UseGuards(RolesGuard)
  @Roles('SUPER_ADMIN')
  adminTopUp(
    @Param('userId') userId: string,
    @Body() dto: { amount: number },
    @Request() req: any,
  ) {
    return this.walletsService.adminTopUp(userId, dto.amount, req.user.sub);
  }
}

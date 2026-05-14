import { Module } from '@nestjs/common';
import { ManualPaymentsService } from './manual-payments.service';
import { ManualPaymentsController } from './manual-payments.controller';

@Module({
  controllers: [ManualPaymentsController],
  providers: [ManualPaymentsService],
  exports: [ManualPaymentsService],
})
export class ManualPaymentsModule {}

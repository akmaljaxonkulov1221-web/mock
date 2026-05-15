import { Module } from '@nestjs/common';
import { DtmTestsService } from './dtm-tests.service';
import { DtmTestsController } from './dtm-tests.controller';

@Module({
  controllers: [DtmTestsController],
  providers: [DtmTestsService],
  exports: [DtmTestsService],
})
export class DtmTestsModule {}

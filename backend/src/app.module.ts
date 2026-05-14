import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './common/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ExamsModule } from './exams/exams.module';
import { AiModule } from './ai/ai.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { PaymentsModule } from './payments/payments.module';
import { NotificationsModule } from './notifications/notifications.module';
import { CentersModule } from './centers/centers.module';
import { StorageModule } from './storage/storage.module';
import { AuditModule } from './audit/audit.module';
import { ManualPaymentsModule } from './manual-payments/manual-payments.module';
import { UploadsModule } from './uploads/uploads.module';

@Module({
  imports: [
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 200 }]),
    PrismaModule,
    StorageModule,
    AuditModule,
    AuthModule,
    UsersModule,
    ExamsModule,
    AiModule,
    AnalyticsModule,
    PaymentsModule,
    ManualPaymentsModule,
    UploadsModule,
    NotificationsModule,
    CentersModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}

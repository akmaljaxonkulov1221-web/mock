import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService) {}

  async getSubscription(userId: string) {
    return this.prisma.subscription.findUnique({ where: { userId } });
  }

  async upgradePlan(userId: string, plan: 'PRO' | 'ENTERPRISE') {
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 1);

    return this.prisma.subscription.upsert({
      where: { userId },
      update: { plan, status: 'ACTIVE', expiresAt },
      create: { userId, plan, status: 'ACTIVE', expiresAt },
    });
  }

  async cancelSubscription(userId: string) {
    return this.prisma.subscription.update({
      where: { userId },
      data: { status: 'CANCELLED' },
    });
  }

  async getAllSubscriptions() {
    return this.prisma.subscription.findMany({
      include: { user: { select: { id: true, name: true, email: true } } },
    });
  }
}

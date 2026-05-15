import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService) {}

  async createOneTimePayment(dto: {
    userId: string;
    examId: string;
    amount: number;
    currency?: string;
    paymentMethod?: string;
    screenshotKey?: string;
  }) {
    const exam = await this.prisma.exam.findUnique({
      where: { id: dto.examId },
    });
    if (!exam) throw new NotFoundException('Imtihon topilmadi');

    return this.prisma.oneTimePayment.create({
      data: {
        userId: dto.userId,
        examId: dto.examId,
        amount: dto.amount,
        currency: dto.currency ?? 'UZS',
        paymentMethod: dto.paymentMethod,
        screenshotKey: dto.screenshotKey,
        status: 'PENDING',
      },
    });
  }

  async getUserPayments(userId: string) {
    return this.prisma.oneTimePayment.findMany({
      where: { userId },
      include: {
        exam: { select: { id: true, title: true, type: true, priceUzs: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getAllPendingPayments() {
    return this.prisma.oneTimePayment.findMany({
      where: { status: 'PENDING' },
      include: {
        user: { select: { id: true, name: true, email: true } },
        exam: { select: { id: true, title: true, type: true, priceUzs: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getAllPayments() {
    return this.prisma.oneTimePayment.findMany({
      include: {
        user: { select: { id: true, name: true, email: true } },
        exam: { select: { id: true, title: true, type: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async approvePayment(paymentId: string, reviewerId: string) {
    const payment = await this.prisma.oneTimePayment.findUnique({
      where: { id: paymentId },
    });
    if (!payment) throw new NotFoundException('To\'lov topilmadi');
    if (payment.status !== 'PENDING') {
      throw new ForbiddenException('Bu to\'lov allaqachon ko\'rib chiqilgan');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const p = await tx.oneTimePayment.update({
        where: { id: paymentId },
        data: {
          status: 'COMPLETED',
          reviewerId,
          reviewedAt: new Date(),
        },
      });

      await tx.examEntitlement.create({
        data: {
          userId: payment.userId,
          examId: payment.examId,
          paymentSource: 'one_time',
        },
      });

      return p;
    });

    return updated;
  }

  async rejectPayment(
    paymentId: string,
    reviewerId: string,
    reason?: string,
  ) {
    const payment = await this.prisma.oneTimePayment.findUnique({
      where: { id: paymentId },
    });
    if (!payment) throw new NotFoundException('To\'lov topilmadi');
    if (payment.status !== 'PENDING') {
      throw new ForbiddenException('Bu to\'lov allaqachon ko\'rib chiqilgan');
    }

    return this.prisma.oneTimePayment.update({
      where: { id: paymentId },
      data: {
        status: 'FAILED',
        reviewerId,
        reviewedAt: new Date(),
        rejectionReason: reason ?? 'Rad etildi',
      },
    });
  }

  async hasUserPaidForExam(userId: string, examId: string): Promise<boolean> {
    const payment = await this.prisma.oneTimePayment.findFirst({
      where: { userId, examId, status: 'COMPLETED' },
    });
    return !!payment;
  }

  async getSubscription(userId: string) {
    return this.prisma.subscription.findUnique({ where: { userId } });
  }

  async getAllSubscriptions() {
    return this.prisma.subscription.findMany({
      include: { user: { select: { id: true, name: true, email: true } } },
    });
  }

  async getPaymentStats() {
    const [totalPayments, completedPayments, pendingPayments, totalRevenue] =
      await Promise.all([
        this.prisma.oneTimePayment.count(),
        this.prisma.oneTimePayment.count({ where: { status: 'COMPLETED' } }),
        this.prisma.oneTimePayment.count({ where: { status: 'PENDING' } }),
        this.prisma.oneTimePayment.aggregate({
          where: { status: 'COMPLETED' },
          _sum: { amount: true },
        }),
      ]);

    return {
      totalPayments,
      completedPayments,
      pendingPayments,
      totalRevenue: totalRevenue._sum.amount ?? 0,
    };
  }

  async getUserPurchases() {
    return this.prisma.oneTimePayment.findMany({
      where: { status: 'COMPLETED' },
      include: {
        user: { select: { id: true, name: true, email: true } },
        exam: { select: { id: true, title: true, type: true, priceUzs: true } },
      },
      orderBy: { reviewedAt: 'desc' },
    });
  }
}

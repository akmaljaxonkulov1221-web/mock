import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { ManualPaymentStatus } from '@prisma/client';
import { PrismaService } from '../common/prisma.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class ManualPaymentsService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  async createRequest(userId: string, dto: { examId: string; screenshotKey: string; amountNote?: string }) {
    if (!dto.examId || !dto.screenshotKey || dto.screenshotKey.length < 8) {
      throw new BadRequestException('examId va screenshotKey to‘g‘ri yuborilishi kerak');
    }
    const exam = await this.prisma.exam.findUnique({ where: { id: dto.examId } });
    if (!exam) throw new NotFoundException('Imtihon topilmadi');
    if (!exam.requiresPayment) {
      throw new BadRequestException('Bu imtihon uchun to‘lov talab qilinmaydi');
    }

    const pending = await this.prisma.manualExamPayment.findFirst({
      where: { userId, examId: dto.examId, status: ManualPaymentStatus.PENDING },
    });
    if (pending) {
      throw new BadRequestException('Sizda allaqachon kutilayotgan to‘lov so‘rovi bor');
    }

    const row = await this.prisma.manualExamPayment.create({
      data: {
        userId,
        examId: dto.examId,
        screenshotKey: dto.screenshotKey,
        amountNote: dto.amountNote,
        status: ManualPaymentStatus.PENDING,
      },
      include: { exam: { select: { id: true, title: true } } },
    });

    await this.prisma.notification.create({
      data: {
        userId,
        type: 'PAYMENT_UPDATE',
        title: 'To‘lov yuborildi',
        body: `${exam.title} uchun chek qabul qilindi. Admin tasdiqlashini kuting.`,
      },
    });

    await this.audit.log({
      userId,
      action: 'MANUAL_PAYMENT_CREATED',
      resource: 'ManualExamPayment',
      resourceId: row.id,
      metadata: { examId: dto.examId },
    });

    return row;
  }

  listMine(userId: string) {
    return this.prisma.manualExamPayment.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { exam: { select: { id: true, title: true, type: true } } },
    });
  }

  listPending() {
    return this.prisma.manualExamPayment.findMany({
      where: { status: ManualPaymentStatus.PENDING },
      orderBy: { createdAt: 'asc' },
      include: {
        user: { select: { id: true, name: true, email: true } },
        exam: { select: { id: true, title: true, type: true, paymentInstructions: true, priceUzs: true } },
      },
    });
  }

  async approve(paymentId: string, reviewerId: string) {
    const payment = await this.prisma.manualExamPayment.findUnique({ where: { id: paymentId } });
    if (!payment) throw new NotFoundException('To‘lov topilmadi');
    if (payment.status !== ManualPaymentStatus.PENDING) {
      throw new BadRequestException('Faqat kutilayotgan so‘rovni tasdiqlash mumkin');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const p = await tx.manualExamPayment.update({
        where: { id: paymentId },
        data: {
          status: ManualPaymentStatus.APPROVED,
          reviewerId,
          reviewedAt: new Date(),
        },
      });

      await tx.examEntitlement.create({
        data: {
          userId: payment.userId,
          examId: payment.examId,
          manualPaymentId: payment.id,
        },
      });

      return p;
    });

    await this.prisma.notification.create({
      data: {
        userId: payment.userId,
        type: 'PAYMENT_UPDATE',
        title: 'To‘lov tasdiqlandi',
        body: 'Endi siz imtihonni boshlashingiz mumkin.',
      },
    });

    await this.audit.log({
      actorId: reviewerId,
      userId: payment.userId,
      action: 'MANUAL_PAYMENT_APPROVED',
      resource: 'ManualExamPayment',
      resourceId: paymentId,
    });

    return updated;
  }

  async reject(paymentId: string, reviewerId: string, reason: string) {
    const payment = await this.prisma.manualExamPayment.findUnique({ where: { id: paymentId } });
    if (!payment) throw new NotFoundException('To‘lov topilmadi');
    if (payment.status !== ManualPaymentStatus.PENDING) {
      throw new BadRequestException('Faqat kutilayotgan so‘rovni rad etish mumkin');
    }

    const updated = await this.prisma.manualExamPayment.update({
      where: { id: paymentId },
      data: {
        status: ManualPaymentStatus.REJECTED,
        reviewerId,
        reviewedAt: new Date(),
        rejectionReason: reason,
      },
    });

    await this.prisma.notification.create({
      data: {
        userId: payment.userId,
        type: 'PAYMENT_UPDATE',
        title: 'To‘lov rad etildi',
        body: reason || 'Admin rad etdi. Yangi chek yuklang.',
      },
    });

    await this.audit.log({
      actorId: reviewerId,
      userId: payment.userId,
      action: 'MANUAL_PAYMENT_REJECTED',
      resource: 'ManualExamPayment',
      resourceId: paymentId,
      metadata: { reason },
    });

    return updated;
  }

  /** Used by exam flow — not an HTTP endpoint by itself */
  async userHasActiveEntitlement(userId: string, examId: string) {
    const ent = await this.prisma.examEntitlement.findFirst({
      where: { userId, examId, consumedAt: null },
    });
    return !!ent;
  }

  async consumeEntitlement(userId: string, examId: string) {
    const ent = await this.prisma.examEntitlement.findFirst({
      where: { userId, examId, consumedAt: null },
      orderBy: { createdAt: 'asc' },
    });
    if (!ent) return;
    await this.prisma.examEntitlement.update({
      where: { id: ent.id },
      data: { consumedAt: new Date() },
    });
  }
}

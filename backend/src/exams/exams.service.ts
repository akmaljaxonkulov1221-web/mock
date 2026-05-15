import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { ExamType } from '@prisma/client';
import { ManualPaymentsService } from '../manual-payments/manual-payments.service';

@Injectable()
export class ExamsService {
  constructor(
    private prisma: PrismaService,
    private manualPayments: ManualPaymentsService,
  ) {}

  async create(dto: {
    title: string;
    type: ExamType;
    duration: number;
    level?: string;
    createdBy: string;
    subjectId?: string;
    requiresPayment?: boolean;
    priceUzs?: number;
    paymentInstructions?: string;
    questions: { question: string; type: string; options?: any; answer?: string; order?: number; passage?: string }[];
  }) {
    const exam = await this.prisma.exam.create({
      data: {
        title: dto.title,
        type: dto.type,
        duration: dto.duration,
        level: dto.level,
        createdBy: dto.createdBy,
        subjectId: dto.subjectId,
        requiresPayment: dto.requiresPayment ?? true,
        priceUzs: dto.priceUzs,
        paymentInstructions: dto.paymentInstructions,
        questions: {
          create: dto.questions.map((q, i) => ({
            question: q.question,
            type: q.type as any,
            options: q.options || null,
            answer: q.answer || null,
            order: q.order ?? i + 1,
            passage: q.passage || null,
          })),
        },
      },
      include: { questions: { orderBy: { order: 'asc' } } },
    });
    return exam;
  }

  async findAll(type?: ExamType, subjectId?: string) {
    const where: Record<string, unknown> = {};
    if (type) where.type = type;
    if (subjectId) where.subjectId = subjectId;
    return this.prisma.exam.findMany({
      where,
      include: {
        questions: { orderBy: { order: 'asc' } },
        subject: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  private async subscriptionSkipsPayment(userId: string) {
    const sub = await this.prisma.subscription.findUnique({ where: { userId } });
    return (
      sub?.status === 'ACTIVE' &&
      (sub.plan === 'PRO' || sub.plan === 'ENTERPRISE')
    );
  }

  async findOneForUser(examId: string, userId: string) {
    const exam = await this.prisma.exam.findUnique({
      where: { id: examId },
      include: { questions: { orderBy: { order: 'asc' } } },
    });
    if (!exam) throw new NotFoundException('Imtihon topilmadi');

    if (!exam.requiresPayment) {
      return {
        exam,
        access: {
          unlocked: true,
          reason: 'NO_PAYMENT_REQUIRED',
          messageUz: 'Bu imtihon bepul ochiq.',
          paymentInstructions: null,
          priceUzs: null,
        },
      };
    }

    if (await this.subscriptionSkipsPayment(userId)) {
      return {
        exam,
        access: {
          unlocked: true,
          reason: 'SUBSCRIPTION',
          messageUz: 'Obuna bo‘yicha imtihon ochiq.',
          paymentInstructions: null,
          priceUzs: null,
        },
      };
    }

    const unlocked = await this.manualPayments.userHasActiveEntitlement(userId, examId);
    const access = {
      unlocked,
      reason: unlocked ? 'MANUAL_PAYMENT' : 'PAYMENT_REQUIRED',
      messageUz: unlocked
        ? 'To‘lov tasdiqlangan. Imtihonni boshlashingiz mumkin.'
        : 'Mock imtihonni boshlash uchun admin tomonidan tasdiqlangan to‘lov talab qilinadi.',
      paymentInstructions: exam.paymentInstructions,
      priceUzs: exam.priceUzs,
    };

    if (!unlocked) {
      const { questions: _removed, ...meta } = exam;
      return {
        exam: { ...meta, questions: [] },
        access,
      };
    }

    return { exam, access };
  }

  async assertCanTakeExam(examId: string, userId: string) {
    const { access } = await this.findOneForUser(examId, userId);
    if (!access.unlocked) {
      throw new ForbiddenException({
        code: 'EXAM_LOCKED',
        messageUz: access.messageUz,
        paymentInstructions: access.paymentInstructions,
        examId,
      });
    }
  }

  async submitResult(dto: {
    userId: string;
    examId: string;
    answers: any;
    score: number;
    cefrLevel?: string;
    integrityScore?: number;
    integrityReport?: Record<string, unknown>;
  }) {
    const exam = await this.prisma.exam.findUnique({ where: { id: dto.examId } });
    if (!exam) throw new NotFoundException('Imtihon topilmadi');

    if (exam.requiresPayment && !(await this.subscriptionSkipsPayment(dto.userId))) {
      const ok = await this.manualPayments.userHasActiveEntitlement(dto.userId, dto.examId);
      if (!ok) {
        throw new ForbiddenException('To‘lov yoki ruxsat yo‘q');
      }
    }

    const result = await this.prisma.result.create({
      data: {
        userId: dto.userId,
        examId: dto.examId,
        score: dto.score,
        cefrLevel: dto.cefrLevel,
        answers: dto.answers,
        integrityScore: dto.integrityScore ?? undefined,
        integrityReport: dto.integrityReport === undefined ? undefined : (dto.integrityReport as object),
        completedAt: new Date(),
      },
    });

    if (exam.requiresPayment && !(await this.subscriptionSkipsPayment(dto.userId))) {
      await this.manualPayments.consumeEntitlement(dto.userId, dto.examId);
    }

    await this.updateAnalytics(dto.userId, dto.score);

    await this.prisma.notification.create({
      data: {
        userId: dto.userId,
        type: 'RESULT_READY',
        title: 'Natija tayyor',
        body: 'Mock imtihon baholandi. "Natijalar" bo‘limidan ko‘ring.',
      },
    });

    return result;
  }

  async logProctorEvent(userId: string, examId: string, eventType: string, detail?: Record<string, unknown>) {
    return this.prisma.proctorLog.create({
      data: {
        userId,
        examId,
        eventType,
        detail: detail === undefined ? undefined : (detail as object),
      },
    });
  }

  async getResults(userId: string) {
    return this.prisma.result.findMany({
      where: { userId },
      include: { exam: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async listSuspiciousResults(limit = 50) {
    return this.prisma.result.findMany({
      where: { integrityScore: { gte: 40 } },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        user: { select: { id: true, name: true, email: true } },
        exam: { select: { id: true, title: true } },
      },
    });
  }

  private async updateAnalytics(userId: string, score: number) {
    const analytics = await this.prisma.analytics.findUnique({ where: { userId } });
    if (analytics) {
      const totalExams = analytics.totalExams + 1;
      const avgScore = ((analytics.avgScore * analytics.totalExams) + score) / totalExams;
      await this.prisma.analytics.update({
        where: { userId },
        data: { totalExams, avgScore },
      });
    }
  }
}

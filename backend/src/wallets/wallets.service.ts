import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class WalletsService {
  constructor(private prisma: PrismaService) {}

  async getOrCreateWallet(userId: string) {
    let wallet = await this.prisma.userWallet.findUnique({
      where: { userId },
    });
    if (!wallet) {
      wallet = await this.prisma.userWallet.create({
        data: { userId, balance: 0 },
      });
    }
    return wallet;
  }

  async getBalance(userId: string) {
    const wallet = await this.getOrCreateWallet(userId);
    return { balance: wallet.balance, walletId: wallet.id };
  }

  async topUp(userId: string, amount: number, referenceId?: string) {
    if (amount <= 0) throw new BadRequestException("Summa 0 dan katta bo'lishi kerak");

    return this.prisma.$transaction(async (tx) => {
      const wallet = await tx.userWallet.upsert({
        where: { userId },
        create: { userId, balance: amount },
        update: { balance: { increment: amount } },
      });

      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          userId,
          type: 'TOP_UP',
          amount,
          description: `Hamyon to'ldirildi: ${amount} UZS`,
          referenceId,
        },
      });

      return wallet;
    });
  }

  async purchaseExam(userId: string, examId: string) {
    const exam = await this.prisma.exam.findUnique({ where: { id: examId } });
    if (!exam) throw new NotFoundException('Imtihon topilmadi');
    if (!exam.priceUzs || exam.priceUzs <= 0) {
      throw new BadRequestException('Bu imtihon narxsiz yoki bepul');
    }

    const existing = await this.prisma.examEntitlement.findFirst({
      where: { userId, examId, consumedAt: null },
    });
    if (existing) {
      throw new BadRequestException('Siz allaqachon bu imtihonga ruxsat oldingiz');
    }

    return this.prisma.$transaction(async (tx) => {
      const wallet = await tx.userWallet.findUnique({ where: { userId } });
      if (!wallet || wallet.balance < exam.priceUzs!) {
        throw new BadRequestException(
          `Balans yetarli emas. Kerak: ${exam.priceUzs} UZS, Balans: ${wallet?.balance ?? 0} UZS`,
        );
      }

      await tx.userWallet.update({
        where: { userId },
        data: { balance: { decrement: exam.priceUzs! } },
      });

      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          userId,
          type: 'PURCHASE',
          amount: exam.priceUzs!,
          description: `Imtihon sotib olindi: ${exam.title}`,
          examId,
        },
      });

      await tx.examEntitlement.create({
        data: {
          userId,
          examId,
          paymentSource: 'wallet',
        },
      });

      return {
        success: true,
        message: `"${exam.title}" imtihoni muvaffaqiyatli sotib olindi`,
        remainingBalance: wallet.balance - exam.priceUzs!,
      };
    });
  }

  async getTransactions(userId: string) {
    const wallet = await this.getOrCreateWallet(userId);
    return this.prisma.walletTransaction.findMany({
      where: { walletId: wallet.id },
      orderBy: { createdAt: 'desc' },
    });
  }

  async adminTopUp(userId: string, amount: number, adminId: string) {
    if (amount <= 0) throw new BadRequestException("Summa 0 dan katta bo'lishi kerak");

    return this.prisma.$transaction(async (tx) => {
      const wallet = await tx.userWallet.upsert({
        where: { userId },
        create: { userId, balance: amount },
        update: { balance: { increment: amount } },
      });

      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          userId,
          type: 'TOP_UP',
          amount,
          description: `Admin tomonidan to'ldirildi`,
          referenceId: adminId,
        },
      });

      return wallet;
    });
  }

  async getAllWallets() {
    return this.prisma.userWallet.findMany({
      include: {
        user: { select: { id: true, name: true, email: true } },
        _count: { select: { transactions: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }
}

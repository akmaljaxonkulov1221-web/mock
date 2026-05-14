import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

interface DtmBlockInput {
  subjectName: string;
  questions: {
    question: string;
    options: string[];
    correctAnswer: number;
    score?: number;
  }[];
}

/** DTM scoring: 3.1 ball for mandatory subjects, 2.1 for others, 1.1 for general */
function calculateDtmScore(
  blocks: { correctCount: number; totalCount: number; blockOrder: number }[],
): { totalScore: number; maxScore: number; blockScores: { blockOrder: number; score: number; maxScore: number }[] } {
  const blockScores: { blockOrder: number; score: number; maxScore: number }[] = [];
  let totalScore = 0;
  let maxScore = 0;

  for (const block of blocks) {
    let scorePerQuestion: number;
    if (block.blockOrder <= 2) {
      scorePerQuestion = 3.1;
    } else if (block.blockOrder <= 4) {
      scorePerQuestion = 2.1;
    } else {
      scorePerQuestion = 1.1;
    }

    const blockScore = block.correctCount * scorePerQuestion;
    const blockMax = block.totalCount * scorePerQuestion;

    blockScores.push({
      blockOrder: block.blockOrder,
      score: Math.round(blockScore * 10) / 10,
      maxScore: Math.round(blockMax * 10) / 10,
    });

    totalScore += blockScore;
    maxScore += blockMax;
  }

  return {
    totalScore: Math.round(totalScore * 10) / 10,
    maxScore: Math.round(maxScore * 10) / 10,
    blockScores,
  };
}

@Injectable()
export class DtmTestsService {
  constructor(private prisma: PrismaService) {}

  async createSession(
    userId: string,
    dto: {
      title: string;
      totalDuration?: number;
      blocks: DtmBlockInput[];
    },
  ) {
    if (!dto.blocks || dto.blocks.length === 0) {
      throw new BadRequestException("Kamida bitta blok bo'lishi kerak");
    }

    return this.prisma.dtmExamSession.create({
      data: {
        userId,
        title: dto.title,
        totalDuration: dto.totalDuration ?? 10800,
        status: 'IN_PROGRESS',
        blocks: {
          create: dto.blocks.map((block, i) => ({
            subjectName: block.subjectName,
            blockOrder: i + 1,
            questions: block.questions as any,
            totalCount: block.questions.length,
          })),
        },
      },
      include: { blocks: { orderBy: { blockOrder: 'asc' } } },
    });
  }

  async getSession(sessionId: string, userId: string) {
    const session = await this.prisma.dtmExamSession.findUnique({
      where: { id: sessionId },
      include: {
        blocks: { orderBy: { blockOrder: 'asc' } },
        user: { select: { id: true, name: true, email: true } },
      },
    });
    if (!session) throw new NotFoundException('DTM sessiya topilmadi');
    if (session.userId !== userId) {
      throw new ForbiddenException('Bu sessiyaga ruxsat yo\'q');
    }
    return session;
  }

  async submitBlock(
    sessionId: string,
    blockId: string,
    userId: string,
    answers: Record<number, number>,
  ) {
    const session = await this.prisma.dtmExamSession.findUnique({
      where: { id: sessionId },
      include: { blocks: true },
    });
    if (!session) throw new NotFoundException('Sessiya topilmadi');
    if (session.userId !== userId) throw new ForbiddenException('Ruxsat yo\'q');
    if (session.status !== 'IN_PROGRESS') {
      throw new BadRequestException('Bu sessiya allaqachon yakunlangan');
    }

    const block = session.blocks.find((b) => b.id === blockId);
    if (!block) throw new NotFoundException('Blok topilmadi');

    const questions = block.questions as {
      question: string;
      options: string[];
      correctAnswer: number;
      score?: number;
    }[];

    let correctCount = 0;
    for (let i = 0; i < questions.length; i++) {
      if (answers[i] === questions[i].correctAnswer) {
        correctCount++;
      }
    }

    return this.prisma.dtmExamBlock.update({
      where: { id: blockId },
      data: {
        answers: answers as any,
        correctCount,
        score: correctCount,
        maxScore: questions.length,
      },
    });
  }

  async completeSession(sessionId: string, userId: string) {
    const session = await this.prisma.dtmExamSession.findUnique({
      where: { id: sessionId },
      include: { blocks: { orderBy: { blockOrder: 'asc' } } },
    });
    if (!session) throw new NotFoundException('Sessiya topilmadi');
    if (session.userId !== userId) throw new ForbiddenException('Ruxsat yo\'q');
    if (session.status !== 'IN_PROGRESS') {
      throw new BadRequestException('Bu sessiya allaqachon yakunlangan');
    }

    const blocksData = session.blocks.map((b) => ({
      correctCount: b.correctCount ?? 0,
      totalCount: b.totalCount ?? 0,
      blockOrder: b.blockOrder,
    }));

    const { totalScore, maxScore, blockScores } = calculateDtmScore(blocksData);

    const updated = await this.prisma.dtmExamSession.update({
      where: { id: sessionId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        totalScore,
        maxScore,
      },
      include: { blocks: { orderBy: { blockOrder: 'asc' } } },
    });

    return { ...updated, blockScores };
  }

  async getUserSessions(userId: string) {
    return this.prisma.dtmExamSession.findMany({
      where: { userId },
      include: {
        blocks: {
          orderBy: { blockOrder: 'asc' },
          select: {
            id: true,
            subjectName: true,
            blockOrder: true,
            score: true,
            maxScore: true,
            correctCount: true,
            totalCount: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getAdminAllSessions() {
    return this.prisma.dtmExamSession.findMany({
      include: {
        user: { select: { id: true, name: true, email: true } },
        blocks: {
          orderBy: { blockOrder: 'asc' },
          select: {
            id: true,
            subjectName: true,
            blockOrder: true,
            score: true,
            maxScore: true,
            correctCount: true,
            totalCount: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createFromQuestionBank(
    userId: string,
    dto: {
      title: string;
      totalDuration?: number;
      blocks: { subjectId: string; subjectName: string; count: number }[];
    },
  ) {
    const blockInputs: DtmBlockInput[] = [];

    for (const blockSpec of dto.blocks) {
      const items = await this.prisma.questionBankItem.findMany({
        where: { subjectId: blockSpec.subjectId, isActive: true, type: 'MCQ' },
        take: blockSpec.count,
        orderBy: { createdAt: 'desc' },
      });

      const questions = items.map((item) => ({
        question: item.question,
        options: Array.isArray(item.options) ? item.options as string[] : [],
        correctAnswer: parseInt(item.answer ?? '0', 10),
      }));

      blockInputs.push({
        subjectName: blockSpec.subjectName,
        questions,
      });
    }

    return this.createSession(userId, {
      title: dto.title,
      totalDuration: dto.totalDuration,
      blocks: blockInputs,
    });
  }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class QuestionBankService {
  constructor(private prisma: PrismaService) {}

  async create(dto: {
    subjectId: string;
    question: string;
    type?: string;
    options?: any;
    answer?: string;
    explanation?: string;
    imageUrl?: string;
    difficulty?: number;
    topic?: string;
  }) {
    return this.prisma.questionBankItem.create({
      data: {
        subjectId: dto.subjectId,
        question: dto.question,
        type: (dto.type as any) || 'MCQ',
        options: dto.options || null,
        answer: dto.answer || null,
        explanation: dto.explanation || null,
        imageUrl: dto.imageUrl || null,
        difficulty: dto.difficulty ?? 1,
        topic: dto.topic || null,
      },
    });
  }

  async createMany(
    subjectId: string,
    items: {
      question: string;
      type?: string;
      options?: any;
      answer?: string;
      explanation?: string;
      imageUrl?: string;
      difficulty?: number;
      topic?: string;
    }[],
  ) {
    const data = items.map((item) => ({
      subjectId,
      question: item.question,
      type: (item.type as any) || 'MCQ',
      options: item.options || null,
      answer: item.answer || null,
      explanation: item.explanation || null,
      imageUrl: item.imageUrl || null,
      difficulty: item.difficulty ?? 1,
      topic: item.topic || null,
    }));
    return this.prisma.questionBankItem.createMany({ data });
  }

  async findBySubject(
    subjectId: string,
    opts?: { topic?: string; difficulty?: number; limit?: number },
  ) {
    const where: Record<string, unknown> = { subjectId, isActive: true };
    if (opts?.topic) where.topic = opts.topic;
    if (opts?.difficulty) where.difficulty = opts.difficulty;

    return this.prisma.questionBankItem.findMany({
      where,
      take: opts?.limit || undefined,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const item = await this.prisma.questionBankItem.findUnique({
      where: { id },
      include: { subject: true },
    });
    if (!item) throw new NotFoundException('Savol topilmadi');
    return item;
  }

  async update(
    id: string,
    dto: {
      question?: string;
      type?: string;
      options?: any;
      answer?: string;
      explanation?: string;
      imageUrl?: string;
      difficulty?: number;
      topic?: string;
      isActive?: boolean;
    },
  ) {
    const data: Record<string, unknown> = {};
    if (dto.question !== undefined) data.question = dto.question;
    if (dto.type !== undefined) data.type = dto.type;
    if (dto.options !== undefined) data.options = dto.options;
    if (dto.answer !== undefined) data.answer = dto.answer;
    if (dto.explanation !== undefined) data.explanation = dto.explanation;
    if (dto.imageUrl !== undefined) data.imageUrl = dto.imageUrl;
    if (dto.difficulty !== undefined) data.difficulty = dto.difficulty;
    if (dto.topic !== undefined) data.topic = dto.topic;
    if (dto.isActive !== undefined) data.isActive = dto.isActive;

    return this.prisma.questionBankItem.update({ where: { id }, data });
  }

  async remove(id: string) {
    return this.prisma.questionBankItem.delete({ where: { id } });
  }

  async getTopics(subjectId: string) {
    const items = await this.prisma.questionBankItem.findMany({
      where: { subjectId, isActive: true },
      select: { topic: true },
      distinct: ['topic'],
    });
    return items.map((i) => i.topic).filter(Boolean);
  }

  async getStats(subjectId: string) {
    const total = await this.prisma.questionBankItem.count({
      where: { subjectId, isActive: true },
    });
    const byDifficulty = await this.prisma.questionBankItem.groupBy({
      by: ['difficulty'],
      where: { subjectId, isActive: true },
      _count: true,
    });
    return { total, byDifficulty };
  }
}

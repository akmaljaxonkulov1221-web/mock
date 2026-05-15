import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class SubjectsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: {
    name: string;
    nameUz?: string;
    description?: string;
    icon?: string;
    order?: number;
    categoryId?: string;
  }) {
    return this.prisma.subject.create({ data: dto });
  }

  async findAll(includeInactive = false, categoryId?: string) {
    const where: Record<string, unknown> = {};
    if (!includeInactive) where.isActive = true;
    if (categoryId) where.categoryId = categoryId;
    return this.prisma.subject.findMany({
      where,
      orderBy: { order: 'asc' },
      include: {
        category: true,
        _count: { select: { exams: true, questionBank: true } },
      },
    });
  }

  async findOne(id: string) {
    const subject = await this.prisma.subject.findUnique({
      where: { id },
      include: {
        category: true,
        exams: {
          orderBy: { createdAt: 'desc' },
          include: { _count: { select: { questions: true } } },
        },
        _count: { select: { questionBank: true } },
      },
    });
    if (!subject) throw new NotFoundException('Fan topilmadi');
    return subject;
  }

  async update(
    id: string,
    dto: {
      name?: string;
      nameUz?: string;
      description?: string;
      icon?: string;
      isActive?: boolean;
      order?: number;
      categoryId?: string;
    },
  ) {
    return this.prisma.subject.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    return this.prisma.subject.delete({ where: { id } });
  }
}

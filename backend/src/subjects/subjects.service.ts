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
  }) {
    return this.prisma.subject.create({ data: dto });
  }

  async findAll(includeInactive = false) {
    const where = includeInactive ? {} : { isActive: true };
    return this.prisma.subject.findMany({
      where,
      orderBy: { order: 'asc' },
      include: { _count: { select: { exams: true } } },
    });
  }

  async findOne(id: string) {
    const subject = await this.prisma.subject.findUnique({
      where: { id },
      include: {
        exams: {
          orderBy: { createdAt: 'desc' },
          include: { _count: { select: { questions: true } } },
        },
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
    },
  ) {
    return this.prisma.subject.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    return this.prisma.subject.delete({ where: { id } });
  }
}

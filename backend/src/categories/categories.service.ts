import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  async create(dto: {
    name: string;
    nameUz?: string;
    description?: string;
    icon?: string;
    order?: number;
  }) {
    return this.prisma.category.create({ data: dto });
  }

  async findAll(includeInactive = false) {
    const where = includeInactive ? {} : { isActive: true };
    return this.prisma.category.findMany({
      where,
      orderBy: { order: 'asc' },
      include: {
        subjects: {
          where: includeInactive ? {} : { isActive: true },
          orderBy: { order: 'asc' },
          include: { _count: { select: { exams: true, questionBank: true } } },
        },
      },
    });
  }

  async findOne(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        subjects: {
          orderBy: { order: 'asc' },
          include: { _count: { select: { exams: true, questionBank: true } } },
        },
      },
    });
    if (!category) throw new NotFoundException('Kategoriya topilmadi');
    return category;
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
    return this.prisma.category.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    return this.prisma.category.delete({ where: { id } });
  }
}

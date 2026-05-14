import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class CentersService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.center.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { users: true } } },
    });
  }

  async create(dto: { name: string; address?: string }) {
    return this.prisma.center.create({ data: dto });
  }

  async assignUser(centerId: string, userId: string) {
    await this.prisma.center.findUniqueOrThrow({ where: { id: centerId } });
    return this.prisma.user.update({
      where: { id: userId },
      data: { centerId },
      select: { id: true, name: true, email: true, centerId: true },
    });
  }

  async remove(id: string) {
    await this.prisma.user.updateMany({ where: { centerId: id }, data: { centerId: null } });
    await this.prisma.center.delete({ where: { id } });
    return { ok: true };
  }
}

import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { Role } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll(role?: string) {
    const where = role ? { role: role as any } : {};
    return this.prisma.user.findMany({
      where,
      select: { id: true, email: true, name: true, role: true, avatar: true, xp: true, streak: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, name: true, role: true, avatar: true, xp: true, streak: true, createdAt: true, analytics: true, subscription: true },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async update(id: string, data: { name?: string; avatar?: string; role?: Role }) {
    return this.prisma.user.update({
      where: { id },
      data,
      select: { id: true, email: true, name: true, role: true, avatar: true },
    });
  }

  async updateRole(id: string, role: Role) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    if (user.role === 'SUPER_ADMIN' && role !== 'SUPER_ADMIN') {
      const count = await this.prisma.user.count({ where: { role: 'SUPER_ADMIN' } });
      if (count <= 1) throw new BadRequestException('Yagona super admin rolini olib bo‘lmaydi');
    }
    return this.update(id, { role });
  }

  async delete(id: string) {
    await this.prisma.user.delete({ where: { id } });
    return { message: 'User deleted successfully' };
  }

  async getLeaderboard() {
    return this.prisma.user.findMany({
      orderBy: { xp: 'desc' },
      take: 50,
      select: { id: true, name: true, avatar: true, xp: true, streak: true },
    });
  }
}

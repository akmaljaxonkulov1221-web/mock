import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  listForUser(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async markRead(userId: string, id: string) {
    return this.prisma.notification.updateMany({
      where: { id, userId },
      data: { read: true },
    });
  }

  async markAllRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });
  }

  createExamReminder(userId: string, examTitle: string, startsAt: Date) {
    return this.prisma.notification.create({
      data: {
        userId,
        type: 'EXAM_REMINDER',
        title: 'Upcoming mock exam',
        body: `${examTitle} is scheduled for ${startsAt.toLocaleString()}.`,
      },
    });
  }
}

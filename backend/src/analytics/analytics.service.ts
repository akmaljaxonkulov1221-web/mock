import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getUserAnalytics(userId: string) {
    const analytics = await this.prisma.analytics.findUnique({ where: { userId } });
    const results = await this.prisma.result.findMany({
      where: { userId },
      include: { exam: true },
      orderBy: { createdAt: 'desc' },
      take: 30,
    });

    const weakSkills = analytics?.weakSkills as string[] || [];
    const progressData = results.map(r => ({
      date: r.createdAt,
      score: r.score,
      examType: r.exam.type,
    }));

    return {
      studyTime: analytics?.studyTime || 0,
      totalExams: analytics?.totalExams || 0,
      avgScore: analytics?.avgScore || 0,
      progressScore: analytics?.progressScore || 0,
      weakSkills,
      progressData,
      recentResults: results.slice(0, 10),
    };
  }

  async getTeacherAnalytics(teacherId: string) {
    const students = await this.prisma.user.findMany({
      where: { teacherId },
      include: { analytics: true, results: { orderBy: { createdAt: 'desc' }, take: 5 } },
    });

    return {
      totalStudents: students.length,
      students: students.map(s => ({
        id: s.id,
        name: s.name,
        avgScore: s.analytics?.avgScore || 0,
        totalExams: s.analytics?.totalExams || 0,
        recentScore: s.results[0]?.score || 0,
      })),
    };
  }

  async getCenterAnalytics(centerId: string) {
    const users = await this.prisma.user.findMany({ where: { centerId }, include: { analytics: true } });
    const totalStudents = users.filter(u => u.role === 'STUDENT').length;
    const totalTeachers = users.filter(u => u.role === 'TEACHER').length;
    const avgScore = users.reduce((acc, u) => acc + (u.analytics?.avgScore || 0), 0) / Math.max(1, users.length);

    return {
      totalStudents,
      totalTeachers,
      avgScore,
      totalUsers: users.length,
    };
  }

  async listAiUsageForAdmin(limit = 300) {
    return this.prisma.aiUsageLog.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { id: true, email: true, name: true } } },
    });
  }

  async updateProgress(userId: string, score: number) {
    const analytics = await this.prisma.analytics.findUnique({ where: { userId } });
    const newProgress = Math.min(100, (analytics?.progressScore || 0) + score * 0.1);
    return this.prisma.analytics.update({
      where: { userId },
      data: { progressScore: Math.round(newProgress * 100) / 100 },
    });
  }
}

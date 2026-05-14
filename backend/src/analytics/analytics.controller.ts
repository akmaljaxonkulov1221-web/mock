import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('analytics')
export class AnalyticsController {
  constructor(private analyticsService: AnalyticsService) {}

  @UseGuards(JwtAuthGuard)
  @Get('my')
  getMyAnalytics(@CurrentUser('id') userId: string) {
    return this.analyticsService.getUserAnalytics(userId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'CENTER_ADMIN')
  @Get('admin/ai-usage')
  adminAiUsage() {
    return this.analyticsService.listAiUsageForAdmin();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('TEACHER', 'CENTER_ADMIN', 'SUPER_ADMIN')
  @Get('teacher/:id')
  getTeacherAnalytics(@Param('id') teacherId: string) {
    return this.analyticsService.getTeacherAnalytics(teacherId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('CENTER_ADMIN', 'SUPER_ADMIN')
  @Get('center/:id')
  getCenterAnalytics(@Param('id') centerId: string) {
    return this.analyticsService.getCenterAnalytics(centerId);
  }
}

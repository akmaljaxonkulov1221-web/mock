import { Controller, Get, Patch, Param, UseGuards } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('notifications')
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  list(@CurrentUser('id') userId: string) {
    return this.notificationsService.listForUser(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('read-all')
  markAll(@CurrentUser('id') userId: string) {
    return this.notificationsService.markAllRead(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/read')
  markRead(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.notificationsService.markRead(userId, id);
  }
}

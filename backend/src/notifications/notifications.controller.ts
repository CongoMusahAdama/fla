import { Controller, Get, Patch, Param, UseGuards, Req } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('notifications')
export class NotificationsController {
    constructor(private readonly notificationsService: NotificationsService) { }

    @UseGuards(AuthGuard('jwt'))
    @Get('my-notifications')
    getMyNotifications(@Req() req) {
        return this.notificationsService.findByUser(req.user.userId);
    }

    @UseGuards(AuthGuard('jwt'))
    @Patch(':id/read')
    markAsRead(@Param('id') id: string) {
        return this.notificationsService.markAsRead(id);
    }
}

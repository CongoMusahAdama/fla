import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { UsersService } from './users.service';

@Injectable()
export class SubscriptionReminderService {
  private readonly logger = new Logger(SubscriptionReminderService.name);

  constructor(private readonly usersService: UsersService) {}

  /** Every day at 09:00 Africa/Accra */
  @Cron('0 9 * * *', { timeZone: 'Africa/Accra' })
  async handleDailySubscriptionReminders() {
    try {
      const result = await this.usersService.sendSubscriptionReminders();
      this.logger.log(`Daily subscription reminders complete (reminded=${result.reminded})`);
    } catch (err: any) {
      this.logger.error(`Subscription reminder cron failed: ${err?.message || err}`);
    }
  }
}

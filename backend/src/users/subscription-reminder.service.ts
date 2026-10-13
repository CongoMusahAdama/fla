import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { UsersService } from './users.service';

@Injectable()
export class SubscriptionReminderService {
  private readonly logger = new Logger(SubscriptionReminderService.name);

  constructor(private readonly usersService: UsersService) {}

  /** Subscription SMS is off. The method stays so the scheduler does not need a rewrite. */
  @Cron('0 9 * * *', { timeZone: 'Africa/Accra' })
  async handleDailySubscriptionReminders() {
    return;
  }
}

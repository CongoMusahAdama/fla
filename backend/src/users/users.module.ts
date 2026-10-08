import { Module, forwardRef } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { SubscriptionReminderService } from './subscription-reminder.service';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './schemas/user.schema';
import { WhatsappClickTopup, WhatsappClickTopupSchema } from '../payments/schemas/whatsapp-click-topup.schema';
import { OrdersModule } from '../orders/orders.module';
import { EmailModule } from '../email/email.module';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: WhatsappClickTopup.name, schema: WhatsappClickTopupSchema },
    ]),
    forwardRef(() => OrdersModule),
    EmailModule,
    SettingsModule,
  ],
  controllers: [UsersController],
  providers: [UsersService, SubscriptionReminderService],
  exports: [UsersService],
})
export class UsersModule { }

import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { OrdersModule } from './orders/orders.module';
import { ProductsModule } from './products/products.module';
import { WishlistModule } from './wishlist/wishlist.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { SupportModule } from './support/support.module';
import { NotificationsModule } from './notifications/notifications.module';
import { UploadModule } from './uploads/upload.module';
import { PaymentsModule } from './payments/payments.module';
import { SettingsModule } from './settings/settings.module';
import { CommonModule } from './common/common.module';
import { LogisticsModule } from './logistics/logistics.module';
import { BillboardsModule } from './billboards/billboards.module';
import { ReferralModule } from './referral/referral.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    MongooseModule.forRoot(process.env.MONGO_URI || 'mongodb://localhost:27017/fla_fashion', {
      // Per API instance. With N load-balanced instances, Atlas sees ~N × maxPoolSize connections.
      maxPoolSize: Number(process.env.MONGO_MAX_POOL || 40),
      minPoolSize: 2,
      serverSelectionTimeoutMS: 8000,
      maxIdleTimeMS: 30_000,
    }),
    // Auth/OTP/upload stay tightly @Throttle'd. Public catalog uses @SkipThrottle so
    // 100 shoppers (or one mobile CGNAT IP) searching together won't get 429s.
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 400,
    }]),
    UsersModule,
    AuthModule,
    OrdersModule,
    ProductsModule,
    WishlistModule,
    DashboardModule,
    SupportModule,
    NotificationsModule,
    UploadModule,
    PaymentsModule,
    SettingsModule,
    CommonModule,
    LogisticsModule,
    BillboardsModule,
    ReferralModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule { }

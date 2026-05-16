import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ConfigModule } from '@nestjs/config';
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

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRoot(process.env.MONGO_URI || 'mongodb://localhost:27017/fla_fashion'),
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 300, // 300 req/minute — prevents blocking normal browsing
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
    LogisticsModule
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

import { Module } from '@nestjs/common';
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

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRoot(process.env.MONGO_URI || 'mongodb://localhost:27017/fla_fashion'),
    UsersModule,
    AuthModule,
    OrdersModule,
    ProductsModule,
    WishlistModule,
    DashboardModule,
    SupportModule,
    NotificationsModule,
    UploadModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }

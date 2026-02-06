import { Module } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { OrdersModule } from '../orders/orders.module';
import { WishlistModule } from '../wishlist/wishlist.module';
import { ProductsModule } from '../products/products.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [OrdersModule, WishlistModule, ProductsModule, UsersModule],
  providers: [DashboardService],
  controllers: [DashboardController]
})
export class DashboardModule { }

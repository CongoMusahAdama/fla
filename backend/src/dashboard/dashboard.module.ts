import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { VisitsController } from './visits.controller';
import { OrdersModule } from '../orders/orders.module';
import { WishlistModule } from '../wishlist/wishlist.module';
import { ProductsModule } from '../products/products.module';
import { UsersModule } from '../users/users.module';
import { PlatformVisit, PlatformVisitSchema } from './schemas/platform-visit.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: PlatformVisit.name, schema: PlatformVisitSchema }]),
    OrdersModule,
    WishlistModule,
    ProductsModule,
    UsersModule,
  ],
  providers: [DashboardService],
  controllers: [DashboardController, VisitsController]
})
export class DashboardModule { }

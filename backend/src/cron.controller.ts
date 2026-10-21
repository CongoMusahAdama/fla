import { Controller, Get, Headers, UnauthorizedException } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { OrdersService } from './orders/orders.service';
import { ProductsService } from './products/products.service';

/** Called by Vercel Cron (see vercel.json), which sends `Authorization: Bearer $CRON_SECRET`. */
@Controller('cron')
export class CronController {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly productsService: ProductsService,
  ) {}

  @SkipThrottle()
  @Get('maintenance')
  async maintenance(@Headers('authorization') authorization?: string) {
    const secret = process.env.CRON_SECRET?.trim();
    if (!secret || authorization !== `Bearer ${secret}`) {
      throw new UnauthorizedException();
    }
    const purgedCheckouts = await this.ordersService.purgeAbandonedCheckouts();
    const archivedProducts = await this.productsService.archiveSoldOutProducts();
    return { ok: true, purgedCheckouts, archivedProducts };
  }
}

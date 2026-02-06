import { Controller, Get, Post, Body, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { WishlistService } from './wishlist.service';
import { CreateWishlistDto } from './dto/create-wishlist.dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('wishlist')
@UseGuards(AuthGuard('jwt'))
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) { }

  @Post()
  create(@Body() createWishlistDto: CreateWishlistDto, @Request() req) {
    return this.wishlistService.addToWishlist(req.user.userId, createWishlistDto.productId);
  }

  @Get('my-wishlist')
  findMyWishlist(@Request() req) {
    return this.wishlistService.findByUser(req.user.userId);
  }

  @Delete(':productId')
  remove(@Param('productId') productId: string, @Request() req) {
    return this.wishlistService.removeFromWishlist(req.user.userId, productId);
  }
}

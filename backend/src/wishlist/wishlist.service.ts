import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateWishlistDto } from './dto/create-wishlist.dto';
import { Wishlist, WishlistDocument } from './schemas/wishlist.schema';

@Injectable()
export class WishlistService {
  constructor(@InjectModel(Wishlist.name) private wishlistModel: Model<WishlistDocument>) { }

  async findByUser(userId: string): Promise<WishlistDocument> {
    let wishlist = await this.wishlistModel
      .findOne({ userId: new Types.ObjectId(userId) })
      .populate('items.productId')
      .exec();

    if (!wishlist) {
      wishlist = new this.wishlistModel({ userId: new Types.ObjectId(userId), items: [] });
      await wishlist.save();
    }
    return wishlist;
  }

  async addToWishlist(userId: string, productId: string): Promise<WishlistDocument> {
    const wishlist = await this.findByUser(userId);

    const itemExists = wishlist.items.find(item => item.productId.toString() === productId);

    if (!itemExists) {
      wishlist.items.push({
        productId: new Types.ObjectId(productId) as any,
        addedAt: new Date()
      });
      return wishlist.save();
    }

    return wishlist;
  }

  async removeFromWishlist(userId: string, productId: string): Promise<WishlistDocument> {
    const wishlist = await this.wishlistModel.findOne({ userId: new Types.ObjectId(userId) }).exec();

    if (!wishlist) {
      throw new NotFoundException('Wishlist not found');
    }

    wishlist.items = wishlist.items.filter(item => item.productId.toString() !== productId);
    return wishlist.save();
  }

  findAll() {
    return this.wishlistModel.find().exec();
  }
}

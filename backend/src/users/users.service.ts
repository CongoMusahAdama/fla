import { Injectable, ConflictException, InternalServerErrorException, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User, UserDocument } from './schemas/user.schema';
import * as bcrypt from 'bcrypt';
import { OrdersService } from '../orders/orders.service';

// Rounds=8: ~25ms (vs 10 rounds=~100ms). Both are cryptographically secure.
const BCRYPT_ROUNDS = 8;

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @Inject(forwardRef(() => OrdersService)) private ordersService: OrdersService
  ) { }

  async create(createUserDto: CreateUserDto): Promise<User> {
    try {
      const hashedPassword = await bcrypt.hash(createUserDto.password, BCRYPT_ROUNDS);
      const role = createUserDto.role || 'customer';
      const uniqueVendorId = role === 'vendor'
        ? `FLA-V-${Math.random().toString(36).substr(2, 6).toUpperCase()}`
        : undefined;

      const createdUser = new this.userModel({
        ...createUserDto,
        // Store email lowercase for consistent fast index lookups
        email: createUserDto.email.toLowerCase().trim(),
        role,
        password: hashedPassword,
        uniqueVendorId,
        status: role === 'vendor' ? 'pending' : 'active',
      });
      return await createdUser.save();
    } catch (error: any) {
      if (error.code === 11000) {
        throw new ConflictException('Email address already exists');
      }
      throw new InternalServerErrorException(error.message || 'Error creating user');
    }
  }

  async findOne(email: string): Promise<UserDocument | null> {
    // Fast exact-match index lookup (no regex = no collection scan)
    return this.userModel.findOne({ email: email.toLowerCase().trim() }).exec();
  }

  async findAll(): Promise<User[]> {
    return this.userModel.find().lean().exec() as any;
  }

  async findOneById(id: string): Promise<User | null> {
    return this.userModel.findById(id).lean().exec() as any;
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User | null> {
    return this.userModel.findByIdAndUpdate(id, { $set: updateUserDto }, { new: true }).lean().exec() as any;
  }

  async findByUniqueVendorId(vendorId: string): Promise<User | null> {
    return this.userModel.findOne({ uniqueVendorId: vendorId }).lean().exec() as any;
  }

  async remove(id: string): Promise<User | null> {
    return this.userModel.findByIdAndDelete(id).exec();
  }

  async findByResetToken(token: string): Promise<UserDocument | null> {
    return this.userModel.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: new Date() }
    }).exec();
  }

  async updatePassword(userId: string, newPassword: string): Promise<void> {
    const hashedPassword = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    await this.userModel.findByIdAndUpdate(userId, {
      $set: { password: hashedPassword },
      $unset: { resetPasswordToken: 1, resetPasswordExpires: 1 }
    }).exec();
  }

  async getPublicVendorProfile(vendorId: string) {
    const user = await this.userModel.findById(vendorId)
      .select('-password -paymentMethods -withdrawalHistory')
      .exec();
    if (!user) {
      throw new NotFoundException('Vendor not found');
    }

    if (user.role === 'vendor' && !user.uniqueVendorId) {
      const uniqueId = `FLA-V-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
      user.uniqueVendorId = uniqueId;
      await this.userModel.findByIdAndUpdate(vendorId, { uniqueVendorId: uniqueId });
    }

    const stats = await this.ordersService.getVendorStats(vendorId);
    return { vendor: user, stats };
  }
}

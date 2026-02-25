import { Injectable, ConflictException, InternalServerErrorException, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User, UserDocument } from './schemas/user.schema';
import * as bcrypt from 'bcrypt';
import { OrdersService } from '../orders/orders.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @Inject(forwardRef(() => OrdersService)) private ordersService: OrdersService
  ) { }

  async create(createUserDto: CreateUserDto): Promise<User> {
    try {
      const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
      const uniqueVendorId = createUserDto.role === 'vendor'
        ? `FLA-V-${Math.random().toString(36).substr(2, 6).toUpperCase()}`
        : undefined;

      const createdUser = new this.userModel({
        ...createUserDto,
        password: hashedPassword,
        uniqueVendorId,
        status: createUserDto.role === 'vendor' ? 'pending' : 'active',
      });
      return await createdUser.save();
    } catch (error: any) {
      if (error.code === 11000) {
        throw new ConflictException('Email address already exists');
      }
      throw new InternalServerErrorException(error.message || 'Error creating user');
    }
  }

  async findOne(email: string): Promise<User | null> {
    return this.userModel.findOne({ email }).exec();
  }

  async findAll(): Promise<User[]> {
    return this.userModel.find().exec();
  }

  async findOneById(id: string): Promise<User | null> {
    return this.userModel.findById(id).exec();
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User | null> {
    return this.userModel.findByIdAndUpdate(id, { $set: updateUserDto }, { new: true }).exec();
  }

  async findByUniqueVendorId(vendorId: string): Promise<User | null> {
    return this.userModel.findOne({ uniqueVendorId: vendorId }).exec();
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
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.userModel.findByIdAndUpdate(userId, {
      $set: { password: hashedPassword },
      $unset: { resetPasswordToken: 1, resetPasswordExpires: 1 }
    }).exec();
  }

  async getPublicVendorProfile(vendorId: string) {
    let user = await this.userModel.findById(vendorId).select('-password -paymentMethods -withdrawalHistory').exec();
    if (!user) {
      throw new NotFoundException('Vendor not found');
    }

    // Ensure they have a unique ID if it was created before this feature
    if (user.role === 'vendor' && !user.uniqueVendorId) {
      const uniqueId = `FLA-V-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
      user.uniqueVendorId = uniqueId;
      await this.userModel.findByIdAndUpdate(vendorId, { uniqueVendorId: uniqueId });
    }

    const stats = await this.ordersService.getVendorStats(vendorId);
    return {
      vendor: user,
      stats
    };
  }
}

import { Injectable, ConflictException, InternalServerErrorException, NotFoundException } from '@nestjs/common';
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
    private ordersService: OrdersService
  ) { }

  async create(createUserDto: CreateUserDto): Promise<User> {
    try {
      const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
      const createdUser = new this.userModel({
        ...createUserDto,
        password: hashedPassword,
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

  async remove(id: string): Promise<User | null> {
    return this.userModel.findByIdAndDelete(id).exec();
  }

  async getPublicVendorProfile(vendorId: string) {
    const user = await this.userModel.findById(vendorId).select('-password -email -phone -paymentMethods -withdrawalHistory').exec();
    if (!user) {
      throw new NotFoundException('Vendor not found');
    }
    const stats = await this.ordersService.getVendorStats(vendorId);
    return {
      vendor: user,
      stats
    };
  }
}

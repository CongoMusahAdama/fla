import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { Order, OrderDocument } from './schemas/order.schema';

@Injectable()
export class OrdersService {
  constructor(@InjectModel(Order.name) private orderModel: Model<OrderDocument>) { }

  async create(createOrderDto: CreateOrderDto): Promise<Order> {
    try {
      // Convert string IDs to ObjectIds
      const { Types } = require('mongoose');

      const orderData: any = {
        ...createOrderDto,
        customerId: new Types.ObjectId(createOrderDto.customerId),
        status: 'pending',
        isPaid: false
      };

      // Convert vendorId if provided
      if (createOrderDto.vendorId) {
        orderData.vendorId = new Types.ObjectId(createOrderDto.vendorId);
      }

      // Convert productIds in items
      if (createOrderDto.items && createOrderDto.items.length > 0) {
        orderData.items = createOrderDto.items.map(item => ({
          ...item,
          productId: new Types.ObjectId(item.productId)
        }));
      }

      const createdOrder = new this.orderModel(orderData);
      return await createdOrder.save();
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  }

  async findAll(): Promise<Order[]> {
    return this.orderModel.find().sort({ createdAt: -1 }).exec();
  }

  async findByUser(userId: string): Promise<Order[]> {
    return this.orderModel.find({ customerId: userId }).sort({ createdAt: -1 }).exec();
  }

  async findByVendor(vendorId: string): Promise<Order[]> {
    return this.orderModel.find({ vendorId: vendorId }).sort({ createdAt: -1 }).exec();
  }

  async findOne(id: string): Promise<Order> {
    const order = await this.orderModel.findById(id).exec();
    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }
    return order;
  }

  async update(id: string, updateOrderDto: UpdateOrderDto): Promise<Order> {
    const existingOrder = await this.orderModel
      .findByIdAndUpdate(id, updateOrderDto, { new: true })
      .exec();

    if (!existingOrder) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }
    return existingOrder;
  }

  async remove(id: string): Promise<Order> {
    const deletedOrder = await this.orderModel.findByIdAndDelete(id).exec();
    if (!deletedOrder) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }
    return deletedOrder;
  }
}

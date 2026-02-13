import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { Order, OrderDocument } from './schemas/order.schema';
import { Product, ProductDocument } from '../products/schemas/product.schema';

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    @InjectModel(Product.name) private productModel: Model<ProductDocument>
  ) { }

  async create(createOrderDto: CreateOrderDto): Promise<Order> {
    try {
      // Convert string IDs to ObjectIds
      const { Types } = require('mongoose');

      // Calculate Splits
      const totalAmount = createOrderDto.totalAmount;
      const adminCommission = totalAmount * 0.1; // 10% Platform Fee
      const vendorShare = totalAmount - adminCommission;

      const orderData: any = {
        ...createOrderDto,
        customerId: new Types.ObjectId(createOrderDto.customerId),
        status: 'pending',
        isPaid: false,
        adminCommission,
        vendorShare
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
      const savedOrder = await createdOrder.save();

      // Unity Purchase Logic: Process Batch Updates
      if (createOrderDto.items && createOrderDto.items.length > 0) {
        for (const item of createOrderDto.items) {
          const product = await this.productModel.findById(item.productId);

          if (product && product.batchSize > 0) {
            // It's a batch product
            const quantity = item.quantity || 1;

            // Atomically increment batch count
            const updatedProduct = await this.productModel.findByIdAndUpdate(
              item.productId,
              { $inc: { currentBatchCount: quantity } },
              { new: true }
            );

            // Check if batch target reached or exceeded
            if (updatedProduct && updatedProduct.currentBatchCount >= updatedProduct.batchSize && updatedProduct.batchStatus !== 'production') {
              // Trigger Production Phase
              await this.productModel.findByIdAndUpdate(item.productId, {
                batchStatus: 'production',
                batchEndDate: new Date() // Mark simply as ended/closed for gathering
              });

              // Only update the order's batch status if it's the one that tipped it over, 
              // or generally keep order status consistent.
              // For now, let's update this specific order to reflect it joined a successful batch.
              savedOrder.batchStatus = 'production';
            } else {
              // Still gathering
              savedOrder.batchStatus = 'gathering';
            }

            // Assign a logical Batch ID (e.g., BATCH-{ProductID}-{Date})
            // Ideally this would be a separate Batch model, but for now we use a string ID
            savedOrder.batchId = `BATCH-${item.productId}-${new Date().toISOString().split('T')[0]}`;
          }
        }
        await savedOrder.save();
      }

      return savedOrder;
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

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
        vendorShare,
        // Set payment submission timestamp if proof is provided
        ...(createOrderDto.paymentProof && { paymentSubmittedAt: new Date() })
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

  async getVendorStats(vendorId: string) {
    const orders = await this.orderModel.find({ vendorId }).exec();
    const total = orders.length;
    const completed = orders.filter(o => o.status === 'delivered').length;
    const cancelled = orders.filter(o => o.status === 'cancelled').length;
    return { total, completed, cancelled };
  }

  async verifyPayment(orderId: string, vendorId: string): Promise<Order> {
    const order = await this.orderModel.findById(orderId).exec();

    if (!order) {
      throw new NotFoundException(`Order with ID ${orderId} not found`);
    }

    // Verify the vendor owns this order
    if (order.vendorId.toString() !== vendorId) {
      throw new NotFoundException('You are not authorized to verify this order');
    }

    // Update payment verification
    order.paymentVerifiedByVendor = true;
    order.paymentVerifiedAt = new Date();
    order.isPaid = true;
    order.paidAt = new Date();
    order.status = 'confirmed'; // Move to confirmed status

    return order.save();
  }

  async getPendingPaymentVerifications(vendorId?: string): Promise<Order[]> {
    const query: any = {
      paymentProof: { $exists: true, $ne: null },
      paymentVerifiedByVendor: false
    };

    // If vendorId provided, filter by vendor
    if (vendorId) {
      query.vendorId = vendorId;
    }

    return this.orderModel
      .find(query)
      .sort({ paymentSubmittedAt: 1 }) // Oldest first (FIFO)
      .exec();
  }
}

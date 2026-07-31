import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Billboard, BillboardDocument } from './schemas/billboard.schema';

export type CreateBillboardInput = {
  title: string;
  subtitle?: string;
  imageUrl: string;
  ctaLabel?: string;
  linkUrl?: string;
  vendorId?: string;
  productId?: string;
  slot: 'hero_main' | 'hero_side';
  startsAt: string | Date;
  endsAt: string | Date;
  isActive?: boolean;
  priority?: number;
};

@Injectable()
export class BillboardsService {
  constructor(
    @InjectModel(Billboard.name) private readonly billboardModel: Model<BillboardDocument>,
  ) {}

  private asDate(value: string | Date, field: string): Date {
    const d = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(d.getTime())) {
      throw new BadRequestException(`Invalid ${field}`);
    }
    return d;
  }

  private normalize(input: CreateBillboardInput) {
    if (!input.title?.trim()) throw new BadRequestException('Title is required');
    if (!input.imageUrl?.trim()) throw new BadRequestException('Image is required');
    if (input.slot !== 'hero_main' && input.slot !== 'hero_side') {
      throw new BadRequestException('Slot must be hero_main or hero_side');
    }

    const startsAt = this.asDate(input.startsAt, 'startsAt');
    const endsAt = this.asDate(input.endsAt, 'endsAt');
    if (endsAt.getTime() <= startsAt.getTime()) {
      throw new BadRequestException('End date must be after start date');
    }

    return {
      title: input.title.trim(),
      subtitle: input.subtitle?.trim() || undefined,
      imageUrl: input.imageUrl.trim(),
      ctaLabel: input.ctaLabel?.trim() || 'Shop now',
      linkUrl: input.linkUrl?.trim() || undefined,
      vendorId: input.vendorId ? new Types.ObjectId(input.vendorId) : undefined,
      productId: input.productId ? new Types.ObjectId(input.productId) : undefined,
      slot: input.slot,
      startsAt,
      endsAt,
      isActive: input.isActive !== false,
      priority: Number.isFinite(Number(input.priority)) ? Number(input.priority) : 0,
    };
  }

  async create(input: CreateBillboardInput) {
    const doc = await this.billboardModel.create(this.normalize(input));
    return this.billboardModel
      .findById(doc._id)
      .populate('vendorId', 'shopName name storeSlug')
      .populate('productId', 'name price images storeSlug vendorId')
      .lean()
      .exec();
  }

  async update(id: string, input: Partial<CreateBillboardInput>) {
    const existing = await this.billboardModel.findById(id).exec();
    if (!existing) throw new NotFoundException('Billboard not found');

    const merged: CreateBillboardInput = {
      title: input.title ?? existing.title,
      subtitle: input.subtitle !== undefined ? input.subtitle : existing.subtitle,
      imageUrl: input.imageUrl ?? existing.imageUrl,
      ctaLabel: input.ctaLabel !== undefined ? input.ctaLabel : existing.ctaLabel,
      linkUrl: input.linkUrl !== undefined ? input.linkUrl : existing.linkUrl,
      vendorId:
        input.vendorId !== undefined
          ? input.vendorId
          : existing.vendorId?.toString(),
      productId:
        input.productId !== undefined
          ? input.productId
          : existing.productId?.toString(),
      slot: input.slot ?? existing.slot,
      startsAt: input.startsAt ?? existing.startsAt,
      endsAt: input.endsAt ?? existing.endsAt,
      isActive: input.isActive !== undefined ? input.isActive : existing.isActive,
      priority: input.priority !== undefined ? input.priority : existing.priority,
    };

    Object.assign(existing, this.normalize(merged));
    await existing.save();
    return this.billboardModel
      .findById(existing._id)
      .populate('vendorId', 'shopName name storeSlug')
      .populate('productId', 'name price images storeSlug vendorId')
      .lean()
      .exec();
  }

  async remove(id: string) {
    const deleted = await this.billboardModel.findByIdAndDelete(id).exec();
    if (!deleted) throw new NotFoundException('Billboard not found');
    return { success: true };
  }

  async findAllAdmin() {
    return this.billboardModel
      .find()
      .populate('vendorId', 'shopName name storeSlug')
      .populate('productId', 'name price images storeSlug vendorId')
      .sort({ priority: -1, startsAt: -1 })
      .lean()
      .exec();
  }

  async findActive(slot?: 'hero_main' | 'hero_side') {
    const now = new Date();
    const filter: Record<string, unknown> = {
      isActive: true,
      startsAt: { $lte: now },
      endsAt: { $gte: now },
    };
    if (slot) filter.slot = slot;

    return this.billboardModel
      .find(filter)
      .populate('vendorId', 'shopName name storeSlug')
      .populate('productId', 'name price images storeSlug vendorId')
      .sort({ priority: -1, startsAt: -1 })
      .lean()
      .exec();
  }
}

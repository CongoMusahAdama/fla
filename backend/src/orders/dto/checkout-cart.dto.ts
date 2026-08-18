import { Type } from 'class-transformer';
import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { OrderItemDto } from './create-order.dto';

export class CheckoutVendorGroupDto {
  @IsString()
  @IsNotEmpty()
  vendorId: string;

  @IsString()
  @IsOptional()
  vendorName?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  /** Referee code for this specific vendor's items — a cart can mix products
   * discovered through different referees' links, so this is scoped per
   * vendor group rather than to the whole cart. */
  @IsString()
  @IsOptional()
  refereeCode?: string;
}

export class CheckoutCartDto {
  @IsString()
  @IsNotEmpty()
  shippingAddress: string;

  @IsString()
  @IsNotEmpty()
  shippingCity: string;

  @IsString()
  @IsNotEmpty()
  shippingRegion: string;

  @IsString()
  @IsOptional()
  customerName?: string;

  @IsString()
  @IsOptional()
  customerEmail?: string;

  @IsString()
  @IsOptional()
  customerPhone?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CheckoutVendorGroupDto)
  vendorGroups: CheckoutVendorGroupDto[];

  /**
   * Cart-level fallback referee code, used for any vendor group that doesn't
   * specify its own (single-vendor carts, or older clients). Prefer each
   * group's own refereeCode when present — see CheckoutVendorGroupDto.
   */
  @IsString()
  @IsOptional()
  refereeCode?: string;
}

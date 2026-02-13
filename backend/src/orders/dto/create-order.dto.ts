import { IsString, IsNotEmpty, IsNumber, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class OrderItemDto {
    @IsString()
    @IsNotEmpty()
    productId: string;

    @IsString()
    @IsNotEmpty()
    name: string;

    @IsNumber()
    @IsNotEmpty()
    price: number;

    @IsNumber()
    @IsNotEmpty()
    quantity: number;

    @IsString()
    @IsOptional()
    size?: string;

    @IsString()
    @IsOptional()
    color?: string;

    @IsString()
    @IsOptional()
    image?: string;
}

export class CreateOrderDto {
    @IsString()
    @IsOptional()
    customerId?: string;

    @IsString()
    @IsOptional()
    vendorId?: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => OrderItemDto)
    items: OrderItemDto[];

    @IsNumber()
    @IsNotEmpty()
    totalAmount: number;

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
    paymentMethod?: string;

    @IsString()
    @IsOptional()
    paymentProof?: string;

    @IsString()
    @IsOptional()
    notes?: string;

    @IsString()
    @IsOptional()
    batchId?: string;

    @IsString()
    @IsOptional()
    batchStatus?: string;
}

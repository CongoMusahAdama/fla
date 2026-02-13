import { IsString, IsNotEmpty, IsNumber, IsOptional, IsArray, IsBoolean } from 'class-validator';

export class CreateProductDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsNotEmpty()
    description: string;

    @IsNumber()
    @IsNotEmpty()
    price: number;

    @IsNumber()
    @IsOptional()
    originalPrice?: number;

    @IsString()
    @IsNotEmpty()
    category: string;

    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    images?: string[];

    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    imageLabels?: string[];

    @IsString()
    @IsOptional()
    vendorId?: string;

    @IsString()
    @IsOptional()
    vendorName?: string;

    @IsNumber()
    @IsOptional()
    stock?: number;

    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    sizes?: string[];

    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    colors?: string[];

    @IsBoolean()
    @IsOptional()
    isFeatured?: boolean;

    @IsNumber()
    @IsOptional()
    batchSize?: number;

    @IsNumber()
    @IsOptional()
    currentBatchCount?: number;

    @IsNumber()
    @IsOptional()
    wholesalePrice?: number;

    @IsString()
    @IsOptional()
    batchStatus?: string;
}

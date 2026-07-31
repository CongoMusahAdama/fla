import { IsBoolean, IsDateString, IsNumber, IsOptional, IsString, IsIn } from 'class-validator';

export class CreateBillboardDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  subtitle?: string;

  @IsString()
  imageUrl: string;

  @IsOptional()
  @IsString()
  ctaLabel?: string;

  @IsOptional()
  @IsString()
  linkUrl?: string;

  @IsOptional()
  @IsString()
  vendorId?: string;

  @IsOptional()
  @IsString()
  productId?: string;

  @IsIn(['hero_main', 'hero_side'])
  slot: 'hero_main' | 'hero_side';

  @IsDateString()
  startsAt: string;

  @IsDateString()
  endsAt: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsNumber()
  priority?: number;
}

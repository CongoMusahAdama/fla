import { IsString, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

/** Nested payout method for PATCH /auth/profile */
class ProfilePaymentMethodDto {
  @IsOptional()
  @IsString()
  type?: string;

  @IsString()
  network: string;

  @IsString()
  accountNumber: string;

  @IsString()
  accountName: string;
}

/**
 * Explicit whitelist for vendor/customer self-service profile updates.
 * Includes KYC document URL fields so soft-onboarded vendors can submit docs.
 */
export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  shopName?: string;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  region?: string;

  @IsOptional()
  @IsString()
  profileImage?: string;

  @IsOptional()
  @IsString()
  bannerImage?: string;

  @IsOptional()
  @IsString()
  momoNumber?: string;

  @IsOptional()
  @IsString()
  accountName?: string;

  @IsOptional()
  @IsString()
  businessRegistration?: string;

  @IsOptional()
  @IsString()
  ghanaCardFront?: string;

  @IsOptional()
  @IsString()
  ghanaCardBack?: string;

  @IsOptional()
  @IsString()
  selfie?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProfilePaymentMethodDto)
  paymentMethods?: ProfilePaymentMethodDto[];
}

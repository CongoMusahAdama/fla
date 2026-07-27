import { IsString, IsOptional, IsArray } from 'class-validator';

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
  productTypes?: string;

  @IsOptional()
  @IsString()
  storeAccentColor?: string;

  @IsOptional()
  @IsString()
  storeThemeColor?: string;

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
  paymentMethods?: Array<{
    type?: string;
    network: string;
    accountNumber: string;
    accountName: string;
  }>;
}

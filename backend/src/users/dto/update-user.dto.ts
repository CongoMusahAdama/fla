import { IsString, IsOptional, IsEmail, MinLength, Matches } from 'class-validator';

export class UpdateUserDto {
    @IsString()
    @IsOptional()
    name?: string;

    @IsString()
    @IsOptional()
    status?: string;

    @IsString()
    @IsOptional()
    phone?: string;

    @IsString()
    @IsOptional()
    shopName?: string;

    @IsString()
    @IsOptional()
    bio?: string;

    @IsString()
    @IsOptional()
    productTypes?: string;

    @IsString()
    @IsOptional()
    location?: string;

    @IsString()
    @IsOptional()
    address?: string;

    @IsString()
    @IsOptional()
    region?: string;

    @IsString()
    @IsOptional()
    profileImage?: string;

    @IsString()
    @IsOptional()
    bannerImage?: string;

    @IsString()
    @IsOptional()
    momoNumber?: string;

    @IsString()
    @IsOptional()
    accountName?: string;

    @IsOptional()
    walletBalance?: number;

    @IsOptional()
    pendingBalance?: number;

    @IsString()
    @IsOptional()
    businessRegistration?: string;

    @IsString()
    @IsOptional()
    vendorTier?: string;

    @IsOptional()
    isVerified?: boolean;

    @IsOptional()
    isIdentityVerified?: boolean;

    @IsOptional()
    isEmailVerified?: boolean;

    @IsOptional()
    verificationStatus?: string;

    @IsOptional()
    verificationDate?: Date;

    @IsOptional()
    verificationDeclineReason?: string;
}

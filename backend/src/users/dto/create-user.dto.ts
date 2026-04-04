import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength, Matches } from 'class-validator';

export class CreateUserDto {
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @IsString()
    @IsNotEmpty()
    @MinLength(8, { message: 'Password must be at least 8 characters long' })
    @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
        message: 'Password is too weak. Must contain uppercase, lowercase, number and special character',
    })
    password: string;

    @IsString()
    @IsOptional()
    name?: string;

    @IsString()
    @IsOptional()
    phone?: string;

    @IsString()
    @IsOptional()
    role?: string;

    @IsString()
    @IsOptional()
    shopName?: string;

    @IsOptional()
    paymentMethods?: Array<{
        network: string;
        accountNumber: string;
        accountName: string;
    }>;

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

    @IsString()
    @IsOptional()
    status?: string;

    @IsOptional()
    walletBalance?: number;

    @IsOptional()
    pendingBalance?: number;
}

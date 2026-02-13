import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateUserDto {
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @IsString()
    @IsNotEmpty()
    @MinLength(6)
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
}

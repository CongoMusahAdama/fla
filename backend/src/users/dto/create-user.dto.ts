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
    ghanaCardFront?: string;

    @IsString()
    @IsOptional()
    ghanaCardBack?: string;

    @IsString()
    @IsOptional()
    ghanaCardNumber?: string;

    @IsString()
    @IsOptional()
    selfie?: string;

    @IsString()
    @IsOptional()
    digitalAddress?: string;

    @IsString()
    @IsOptional()
    dob?: string;

    @IsString()
    @IsOptional()
    utilityBill?: string;

    @IsString()
    @IsOptional()
    businessRegistration?: string;

    @IsString()
    @IsOptional()
    utilityType?: string;

    @IsString()
    @IsOptional()
    employeeCount?: string;

    @IsString()
    @IsOptional()
    yearsOfExistence?: string;

    @IsString()
    @IsOptional()
    turnstileToken?: string;

    @IsString()
    @IsOptional()
    role?: string;
}

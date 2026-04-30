import { IsNumber, IsString, IsOptional, Min } from 'class-validator';

export class RequestWithdrawalDto {
    @IsNumber()
    @Min(1)
    amount: number;

    @IsString()
    @IsOptional()
    paymentMethod?: string;

    @IsString()
    @IsOptional()
    momoNumber?: string;

    @IsString()
    @IsOptional()
    accountName?: string;

    @IsString()
    @IsOptional()
    notes?: string;
}

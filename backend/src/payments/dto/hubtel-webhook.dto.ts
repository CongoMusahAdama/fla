import { IsString, IsOptional, IsObject, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class HubtelMetadataDto {
    @IsString()
    @IsOptional()
    orderId?: string;

    @IsString()
    @IsOptional()
    paymentType?: string;
}

class HubtelDataDto {
    @IsString()
    @IsOptional()
    ClientReference?: string;

    @IsString()
    @IsOptional()
    TransactionId?: string;

    @IsObject()
    @IsOptional()
    @ValidateNested()
    @Type(() => HubtelMetadataDto)
    Metadata?: HubtelMetadataDto;
}

export class HubtelWebhookDto {
    @IsString()
    @IsOptional()
    Status?: string;

    @IsObject()
    @IsOptional()
    @ValidateNested()
    @Type(() => HubtelDataDto)
    Data?: HubtelDataDto;

    // Support camelCase variants just in case
    @IsString()
    @IsOptional()
    status?: string;

    @IsString()
    @IsOptional()
    clientReference?: string;

    @IsString()
    @IsOptional()
    transactionId?: string;

    @IsObject()
    @IsOptional()
    metadata?: any;
}

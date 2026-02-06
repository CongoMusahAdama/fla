import { IsString, IsNotEmpty } from 'class-validator';

export class CreateWishlistDto {
    @IsString()
    @IsNotEmpty()
    productId: string;
}

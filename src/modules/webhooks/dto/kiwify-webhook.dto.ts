import { IsString, IsObject, IsOptional } from 'class-validator';

export class KiwifyProductDto {
  @IsString()
  product_id: string;

  @IsString()
  product_name: string;
}

export class KiwifyCustomerDto {
  @IsString()
  full_name: string;

  @IsString()
  email: string;

  @IsOptional()
  @IsString()
  mobile?: string;
}

export class KiwifyWebhookDto {
  @IsString()
  order_id: string;

  @IsString()
  order_status: string; // 'paid', 'refunded', 'chargedback'

  @IsObject()
  Product: KiwifyProductDto;

  @IsObject()
  Customer: KiwifyCustomerDto;

  @IsOptional()
  @IsString()
  signature?: string;
}
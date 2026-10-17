import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsIn,
  IsOptional,
  IsString,
  Length,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { SHIPPING_METHOD_IDS, type ShippingMethodId } from '../shipping.constants';

export class ShippingAddressDto {
  @ApiProperty({ example: 'Jane Doe' })
  @IsString()
  @Length(2, 100)
  fullName: string;

  @ApiProperty({ example: '+1 555 123 4567' })
  @IsString()
  @Length(5, 30)
  phone: string;

  @ApiProperty({ example: '1 Main St' })
  @IsString()
  @Length(3, 200)
  street: string;

  @ApiPropertyOptional({ example: 'Apt 4B' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  apt?: string;

  @ApiProperty({ example: 'Austin' })
  @IsString()
  @Length(1, 100)
  city: string;

  @ApiProperty({ example: 'TX' })
  @IsString()
  @Length(1, 100)
  state: string;

  @ApiProperty({ example: '78701' })
  @IsString()
  @Length(2, 20)
  zip: string;

  @ApiProperty({ example: 'United States' })
  @IsString()
  @Length(2, 100)
  country: string;
}

export class QuoteOrderDto {
  @ApiProperty({ example: 'clistingid1' })
  @IsString()
  @MinLength(1)
  listingId: string;

  @ApiPropertyOptional({ enum: [...SHIPPING_METHOD_IDS], default: 'standard' })
  @IsOptional()
  @IsIn([...SHIPPING_METHOD_IDS])
  shippingMethod?: ShippingMethodId;

  @ApiPropertyOptional({ example: 'WELCOME10' })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  promoCode?: string;
}

export class CreateOrderDto extends QuoteOrderDto {
  @ApiProperty({ type: ShippingAddressDto })
  @ValidateNested()
  @Type(() => ShippingAddressDto)
  shippingAddress: ShippingAddressDto;
}

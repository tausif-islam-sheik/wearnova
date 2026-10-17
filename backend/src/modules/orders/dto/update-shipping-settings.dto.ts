import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

export class ShippingMethodDto {
  @ApiProperty({ example: 'Standard' })
  @IsString()
  @Length(1, 40)
  label: string;

  @ApiProperty({ example: '3–5 business days' })
  @IsString()
  @Length(1, 60)
  eta: string;

  @ApiProperty({ example: 5.99 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(500)
  price: number;

  @ApiProperty()
  @IsBoolean()
  enabled: boolean;

  @ApiProperty()
  @IsBoolean()
  freeEligible: boolean;
}

export class UpdateShippingSettingsDto {
  @ApiProperty({ type: ShippingMethodDto })
  @ValidateNested()
  @Type(() => ShippingMethodDto)
  standard: ShippingMethodDto;

  @ApiProperty({ type: ShippingMethodDto })
  @ValidateNested()
  @Type(() => ShippingMethodDto)
  express: ShippingMethodDto;

  @ApiPropertyOptional({
    description: 'Free shipping on orders of at least this amount; null/omitted = off',
    nullable: true,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(1)
  @Max(100000)
  freeShippingOver?: number | null;
}

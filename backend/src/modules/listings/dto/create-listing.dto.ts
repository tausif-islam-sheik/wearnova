import {
  IsString,
  IsOptional,
  IsNumber,
  IsInt,
  IsBoolean,
  IsArray,
  MinLength,
  Min,
  Max,
  IsIn,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateListingDto {
  @ApiProperty({ example: 'Zara Satin Midi Dress - Emerald Green' })
  @IsString()
  @MinLength(5)
  title: string;

  @ApiProperty({ example: 'Beautiful emerald green satin midi dress...' })
  @IsString()
  @MinLength(20)
  description: string;

  @ApiProperty({ example: 35 })
  @IsNumber()
  @Min(1)
  price: number;

  @ApiProperty({ example: 'Zara' })
  @IsString()
  brand: string;

  @ApiProperty({ example: 'M' })
  @IsString()
  size: string;

  @ApiProperty({ example: 'very_good' })
  @IsString()
  @IsIn(['new_with_tags', 'new_without_tags', 'very_good', 'good', 'satisfactory'])
  condition: string;

  @ApiPropertyOptional({ example: 'Satin' })
  @IsOptional()
  @IsString()
  material?: string;

  @ApiPropertyOptional({ example: 'Green' })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiProperty({ example: ['url1.jpg', 'url2.jpg'] })
  @IsArray()
  @IsString({ each: true })
  images: string[];

  @ApiProperty({ example: 'women-clothing-dresses' })
  @IsString()
  categoryId: string;

  @ApiPropertyOptional({ example: 1, description: 'Units available to buy (default 1).' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(9999)
  quantity?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  shippingFree?: boolean;
}

export class UpdateListingDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(5)
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(20)
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(1)
  price?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  brand?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  size?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsIn(['new_with_tags', 'new_without_tags', 'very_good', 'good', 'satisfactory'])
  condition?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  material?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional({ description: 'Units available to buy. 0 marks the item sold out.' })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(9999)
  quantity?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  shippingFree?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsIn(['active', 'sold', 'reserved', 'deactivated'])
  status?: string;
}

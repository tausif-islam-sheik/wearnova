import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, Length, MaxLength } from 'class-validator';

export class AddressDto {
  @ApiPropertyOptional({ example: 'Home' })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  label?: string;

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

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

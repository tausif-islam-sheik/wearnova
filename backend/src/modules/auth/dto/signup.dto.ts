import { IsEmail, IsString, Matches, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SignupDto {
  @ApiProperty({ example: 'Jane Doe' })
  @IsString()
  @MinLength(2)
  name: string;

  @ApiProperty({ example: 'jane@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: '+61412345678' })
  @IsString()
  @Matches(/^\+[1-9]\d{6,14}$/, {
    message: 'Please enter a valid mobile number with its country code (e.g. +61 412 345 678)',
  })
  phone: string;
}

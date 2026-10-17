import { IsString, IsInt, IsOptional, Min, Max, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateReviewDto {
  @ApiProperty({ example: 'order-1' })
  @IsString()
  orderId: string;

  @ApiProperty({ example: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiPropertyOptional({ example: 'Great seller!' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  comment?: string;
}

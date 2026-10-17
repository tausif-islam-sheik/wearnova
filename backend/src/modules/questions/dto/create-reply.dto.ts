import { IsString, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateReplyDto {
  @ApiProperty({ example: 'Yes, it is available!' })
  @IsString()
  @MinLength(2)
  @MaxLength(1000)
  text: string;
}

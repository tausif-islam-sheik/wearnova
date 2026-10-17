import { IsString, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateQuestionDto {
  @ApiProperty({ example: 'Is this still available?' })
  @IsString()
  @MinLength(2)
  @MaxLength(1000)
  text: string;
}

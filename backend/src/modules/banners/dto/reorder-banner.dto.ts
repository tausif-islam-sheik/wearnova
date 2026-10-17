import { IsString } from 'class-validator';

export class ReorderBannerDto {
  @IsString()
  id!: string;

  @IsString()
  direction!: 'up' | 'down';
}

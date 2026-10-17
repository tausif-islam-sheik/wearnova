import { IsString, IsOptional, IsBoolean, IsNumber } from 'class-validator';

export class CreateBannerDto {
  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  body?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsNumber()
  order?: number;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

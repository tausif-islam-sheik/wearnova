import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

/** Omit a field to leave it unchanged; send "" to remove the saved value (falls back to .env). */
export class UpdateStripeSettingsDto {
  @ApiPropertyOptional({ example: 'sk_live_...' })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  secretKey?: string;

  @ApiPropertyOptional({ example: 'pk_live_...' })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  publishableKey?: string;

  @ApiPropertyOptional({ example: 'whsec_...' })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  webhookSecret?: string;
}

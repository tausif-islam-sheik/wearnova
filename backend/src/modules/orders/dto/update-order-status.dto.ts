import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { OrderStatus } from '@/generated/enums';

export class UpdateOrderStatusDto {
  @ApiProperty({ enum: OrderStatus, example: 'shipped' })
  @IsEnum(OrderStatus)
  status: OrderStatus;
}

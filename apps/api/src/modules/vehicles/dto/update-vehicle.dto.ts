import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateVehicleDto } from './create-vehicle.dto';
import { IsOptional, IsPositive } from 'class-validator';

export class UpdateVehicleDto extends PartialType(CreateVehicleDto) {
  @ApiProperty({
    description: 'Capacidade de passageiros',
    example: 5,
    required: false,
    minimum: 0,
  })
  @IsOptional()
  @IsPositive()
  passenger_capacity?: number;
}

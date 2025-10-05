import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class TimeWindowDto {
  @ApiProperty({
    description: 'Hora de início',
    example: '09:00',
  })
  @IsString()
  @IsNotEmpty()
  start!: string;

  @ApiProperty({
    description: 'Hora de fim',
    example: '12:00',
  })
  @IsString()
  @IsNotEmpty()
  end!: string;
}

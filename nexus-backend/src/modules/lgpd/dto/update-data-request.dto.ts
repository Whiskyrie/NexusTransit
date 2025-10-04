import { IsEnum, IsString, IsOptional, IsUUID } from 'class-validator';
import { DataRequestStatus } from '../enums/lgpdEnums';

export class UpdateDataRequestDto {
  @IsOptional()
  @IsEnum(DataRequestStatus)
  declare status?: DataRequestStatus;

  @IsOptional()
  @IsString()
  declare adminNotes?: string;

  @IsOptional()
  @IsUUID()
  declare processedBy?: string;

  @IsOptional()
  @IsString()
  declare errorMessage?: string;
}

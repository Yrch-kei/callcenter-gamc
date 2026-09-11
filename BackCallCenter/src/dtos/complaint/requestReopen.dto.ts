import { IsOptional, IsString, MinLength } from 'class-validator';

export class RequestReopenDto {
  @IsOptional()
  @IsString()
  @MinLength(5, { message: 'Debes detallar el motivo de disconformidad (mínimo 5 caracteres).' })
  reason?: string;

  @IsOptional()
  @IsString()
  @MinLength(5, { message: 'Debes detallar el motivo de disconformidad (mínimo 5 caracteres).' })
  reopenReason?: string;
}

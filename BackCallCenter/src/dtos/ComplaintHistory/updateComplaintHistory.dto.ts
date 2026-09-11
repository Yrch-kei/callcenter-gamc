import { IsOptional, IsString, Length, IsInt } from 'class-validator';

export class UpdateComplaintHistoryDto {
  @IsOptional()
  @IsString()
  @Length(1, 300)
  description?: string;

  @IsOptional()
  @IsInt()
  status?: number;
}

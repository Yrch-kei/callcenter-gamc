import { IsInt, IsNotEmpty, IsOptional, IsString, Length } from 'class-validator';

export class CreateComplaintHistoryDto {
  @IsInt()
  complaintId!: number;

  @IsString()
  @IsNotEmpty()
  @Length(1, 300)
  description!: string;

  @IsInt()
  userId!: number;

  @IsString()
  @IsOptional()
  tipo?: string;
}

import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  IsEnum,
} from 'class-validator';
import { ComplaintStatus } from 'types/complaint';

export class CreateComplaintDto {
  @IsString()
  @IsNotEmpty()
  names!: string;

  @IsString()
  @IsNotEmpty()
  lastname!: string;

  @IsString()
  @IsNotEmpty()
  phone!: string;

  @IsOptional()
  @IsString()
  code?: string;

  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsNotEmpty()
  incident!: string;

  @IsString()
  @IsNotEmpty()
  latitude!: string;

  @IsString()
  @IsNotEmpty()
  longitude!: string;

  @IsString()
  @IsNotEmpty()
  address!: string;

  @IsOptional()
  @IsInt()
  risk?: number;

  @IsOptional()
  @IsInt()
  amount?: number;

  @IsOptional()
  @IsString()
  evidence?: string;

  @IsOptional()
  @IsEnum(['Pendiente','Atendido','Derivado'])
  status?: ComplaintStatus;

  @IsInt()
  createdBy!: number;

  @IsOptional()
  @IsInt()
  editBy?: number;

  @IsInt()
  categoryId!: number;

  @IsOptional()
  @IsInt()
  mandatedId?: number;

  @IsOptional()
  @IsInt()
  companyId?: number;

  @IsInt()
  locationId!: number;

  @IsOptional()
  @IsString()
  citizenEmail?: string;

  @IsOptional()
  notifyEmail?: boolean;
}

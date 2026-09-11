import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  IsEnum,
} from 'class-validator';
import { ComplaintStatus } from 'types/complaint';
  
  export class UpdateComplaintDto {
    @IsOptional()
    @IsString()
    names?: string;
  
    @IsOptional()
    @IsString()
    lastname?: string;
  
    @IsOptional()
    @IsString()
    phone?: string;
  
    @IsOptional()
    @IsString()
    code?: string;
  
    @IsOptional()
    @IsString()
    title?: string;

    @IsOptional()
    @IsString()
    incident?: string;
  
    @IsOptional()
    @IsString()
    latitude?: string;
  
    @IsOptional()
    @IsString()
    longitude?: string;
  
    @IsOptional()
    @IsString()
    address?: string;
  
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
  
    @IsOptional()
    @IsInt()
    editBy?: number;
  
    @IsOptional()
    @IsInt()
    categoryId?: number;
  
    @IsOptional()
    @IsInt()
    mandatedId?: number;
  
    @IsOptional()
    @IsInt()
    companyId?: number;
  
    @IsOptional()
    @IsInt()
    locationId?: number;
  }
  
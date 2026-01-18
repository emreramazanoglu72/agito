import { IsOptional, IsString, IsEnum } from 'class-validator';
import { PaymentStatus } from '@prisma/client';

export class PaymentFilterDto {
  @IsOptional()
  @IsString()
  page?: string;

  @IsOptional()
  @IsString()
  limit?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(PaymentStatus)
  status?: PaymentStatus;

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;
  @IsOptional()
  @IsString()
  companyId?: string;
}

import { IsArray, IsOptional, IsString } from 'class-validator';

export class ActivateCorporatePolicyDto {
  @IsString()
  policyType: string;

  @IsString()
  startDate: string;

  @IsString()
  endDate: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  employeeIds?: string[];
}

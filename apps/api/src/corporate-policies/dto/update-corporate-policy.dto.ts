import { IsOptional, IsString } from 'class-validator';

export class UpdateCorporatePolicyDto {
  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;
}

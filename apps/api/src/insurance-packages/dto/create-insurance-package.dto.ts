import { IsArray, IsBoolean, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateInsurancePackageDto {
  @IsString()
  name: string;

  @IsString()
  tier: string;

  @IsString()
  priceRange: string;

  @IsString()
  focus: string;

  @IsArray()
  @IsString({ each: true })
  highlights: string[];

  @IsOptional()
  @IsInt()
  @Min(1)
  minEmployees?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  carrierIds?: string[];
}

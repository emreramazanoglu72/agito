import { Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, IsString, Min, ValidateNested } from 'class-validator';

export class AiFiltersDto {
  @IsOptional()
  @IsString()
  dateFrom?: string;

  @IsOptional()
  @IsString()
  dateTo?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  windowDays?: number;
}

export class AiRequestDto {
  @IsString()
  prompt!: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => AiFiltersDto)
  filters?: AiFiltersDto;

  @IsOptional()
  @IsBoolean()
  useLlm?: boolean;
}

import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class CreateCarrierDto {
  @IsString()
  name: string;

  @IsString()
  code: string;

  @IsOptional()
  @IsString()
  logoUrl?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

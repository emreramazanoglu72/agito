import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCompanyDto {
  @ApiProperty({ example: 'Agito Teknoloji A.Ş.' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: '1234567890' })
  @IsString()
  @IsNotEmpty()
  taxId: string;

  @ApiPropertyOptional({ example: 'Maslak Mah.' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ example: 'Istanbul' })
  @IsOptional()
  @IsString()
  city?: string;
}

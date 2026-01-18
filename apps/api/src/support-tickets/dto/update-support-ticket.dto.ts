import { IsOptional, IsString } from 'class-validator';

export class UpdateSupportTicketDto {
  @IsOptional()
  @IsString()
  status?: string;
}

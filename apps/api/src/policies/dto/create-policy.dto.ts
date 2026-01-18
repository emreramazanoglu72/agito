import { IsDateString, IsEnum, IsUUID } from 'class-validator';

export enum PolicyType {
  TSS = 'TSS',
  OSS = 'OSS',
  LIFE = 'LIFE',
  FERDI_KAZA = 'FERDI_KAZA',
}

export class CreatePolicyDto {
  @IsUUID()
  employeeId: string;

  @IsEnum(PolicyType)
  type: PolicyType;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;
  // Premium is calculated by the system, not passed by API
}

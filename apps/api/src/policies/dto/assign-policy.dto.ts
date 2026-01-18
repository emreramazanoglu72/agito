import { IsUUID } from 'class-validator';

export class AssignPolicyDto {
  @IsUUID()
  employeeId: string;
}

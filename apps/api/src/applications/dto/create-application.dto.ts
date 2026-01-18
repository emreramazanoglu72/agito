export class CreateApplicationDto {
  packageId: string;
  carrierId?: string;
  companyName: string;
  companyEmail: string;
  companyPhone: string;
  employeeCount: number;
  employeeList: string[];
  hasDocuments?: boolean;
}

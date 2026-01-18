export class CreateBulkOperationDto {
  companyId: string;
  type: 'BULK_UPLOAD' | 'BULK_ENDORSEMENT';
}

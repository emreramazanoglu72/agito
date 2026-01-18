export class UpdateApplicationDto {
  status?: 'DRAFT' | 'SUBMITTED' | 'IN_REVIEW' | 'NEEDS_INFO' | 'APPROVED' | 'REJECTED' | 'ACTIVE';
  adminNote?: string;
}

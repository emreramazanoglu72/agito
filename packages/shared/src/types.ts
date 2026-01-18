// =====================================================
// Core Entity Types - Single Source of Truth
// =====================================================

// ----------------------
// Enums
// ----------------------

export type UserRole = 'ADMIN' | 'HR_MANAGER' | 'EMPLOYEE';

export type PolicyTypeEnum = 'TSS' | 'OSS' | 'LIFE' | 'FERDI_KAZA';

export type PolicyStatus = 'ACTIVE' | 'CANCELLED' | 'PENDING_RENEWAL' | 'EXPIRED';

export type PaymentStatus = 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED';

export type EmployeeStatus = 'ACTIVE' | 'INACTIVE' | 'PENDING';

export type ApplicationStatus = 'DRAFT' | 'SUBMITTED' | 'IN_REVIEW' | 'NEEDS_INFO' | 'APPROVED' | 'REJECTED' | 'ACTIVE';

export type SupportTicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';

export type ActivityType =
    | 'COMPANY_CREATED'
    | 'COMPANY_UPDATED'
    | 'COMPANY_DELETED'
    | 'DEPARTMENT_CREATED'
    | 'DEPARTMENT_UPDATED'
    | 'DEPARTMENT_DELETED'
    | 'EMPLOYEE_CREATED'
    | 'EMPLOYEE_UPDATED'
    | 'EMPLOYEE_DELETED'
    | 'POLICY_CREATED'
    | 'POLICY_UPDATED'
    | 'POLICY_DELETED'
    | 'BULK_UPLOAD_COMPLETED'
    | 'BULK_UPLOAD_FAILED';

// ----------------------
// Core Entities
// ----------------------

export interface Company {
    id: string;
    name: string;
    taxId: string;
    address?: string;
    city?: string;
    email?: string;
    phone?: string;
    website?: string;
    sector?: string;
    employeeCount?: number;
    tenantId: string;
    createdAt: string;
    updatedAt: string;
}

export interface Department {
    id: string;
    name: string;
    code: string;
    description?: string;
    isActive: boolean;
    tenantId: string;
    companyId: string;
    managerId?: string;
    createdAt: string;
    updatedAt: string;
}

export interface Employee {
    id: string;
    tcNo: string;
    firstName: string;
    lastName: string;
    fullName: string; // Computed: firstName + lastName
    email?: string;
    phoneNumber?: string;
    birthDate: string;
    avatarUrl?: string;
    departmentId?: string;
    department?: Department;
    tenantId: string;
    companyId: string;
    company?: Company;
    status: EmployeeStatus;
    activePoliciesCount: number;
    createdAt: string;
    updatedAt: string;
}

export interface Policy {
    id: string;
    policyNo: string;
    type: PolicyTypeEnum;
    status: PolicyStatus;
    startDate: string;
    endDate: string;
    premium: number;
    currency: string;
    tenantId: string;
    employeeId: string;
    employee?: Employee;
    companyId: string;
    company?: Company;
    autoRenew: boolean;
    packageName?: string;
    createdAt: string;
    updatedAt: string;
}

export interface PolicyPayment {
    id: string;
    policyId: string;
    installmentNo: number;
    amount: number;
    dueDate: string;
    paidDate?: string;
    status: PaymentStatus;
    createdAt: string;
    updatedAt: string;
}

export interface EmployeeDocument {
    id: string;
    employeeId: string;
    name: string;
    size: number;
    type: string;
    url: string;
    key?: string;
    tenantId: string;
    createdAt: string;
    updatedAt: string;
}

export interface Activity {
    id: string;
    type: ActivityType;
    title: string;
    description?: string;
    userId?: string;
    userName?: string;
    tenantId: string;
    targetId?: string;
    targetType?: string;
    createdAt: string;
}

// ----------------------
// API Response Types
// ----------------------

export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface ApiError {
    statusCode: number;
    message: string;
    error?: string;
}

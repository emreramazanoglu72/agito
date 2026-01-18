import { Department } from './departments';

export interface Company {
    id: string;
    name: string;
}

export interface Employee {
    id: string;
    firstName: string;
    lastName: string;
    fullName: string;
    email: string;
    phoneNumber?: string;
    tcNo: string;
    departmentId?: string;
    department?: Department;
    status: 'ACTIVE' | 'INACTIVE' | 'PENDING';
    companyId: string;
    company?: Company;
    activePoliciesCount: number;
    avatarUrl?: string;
    createdAt: string;
    updatedAt: string;
}

export interface Policy {
    id: string;
    policyNo: string;
    type: string;
    premium: number;
    status: 'ACTIVE' | 'CANCELLED' | 'EXPIRED' | 'PENDING';
    startDate: string;
    endDate: string;
    employeeId: string;
}

export interface Payment {
    id: string;
    installment: number;
    amount: number;
    dueDate: string;
    status: 'PAID' | 'PENDING' | 'OVERDUE';
    policyId: string;
}

export interface Document {
    id: string;
    name: string;
    type: string;
    size: number;
    url: string;
    uploadedAt: string;
    employeeId: string;
}

export interface Activity {
    id: string;
    type: string;
    description: string;
    timestamp: string;
    userId: string;
    employeeId: string;
}

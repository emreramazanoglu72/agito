export interface Department {
    id: string;
    name: string;
    code: string;
    description?: string;
    isActive: boolean;
    companyId: string;
    managerId?: string;
    company?: {
        id: string;
        name: string;
    };
    manager?: {
        id: string;
        firstName: string;
        lastName: string;
    };
    _count?: {
        employees: number;
    };
    createdAt?: string;
    updatedAt?: string;
}

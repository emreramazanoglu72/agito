// Elasticsearch Response Types
// Use these instead of @ts-ignore

export interface ElasticsearchHit<T> {
    _index: string;
    _id: string;
    _score: number;
    _source: T;
}

export interface ElasticsearchSearchResponse<T> {
    hits: {
        total: { value: number; relation: string } | number;
        max_score: number | null;
        hits: ElasticsearchHit<T>[];
    };
}

// Document types for Elasticsearch indices
export interface CompanyEsDocument {
    name: string;
    taxId: string;
    city?: string;
    tenantId: string;
}

export interface EmployeeEsDocument {
    firstName: string;
    lastName: string;
    fullName: string;
    tcNo: string;
    companyId: string;
    departmentId?: string;
    tenantId: string;
}

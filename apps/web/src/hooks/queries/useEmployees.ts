import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Employee, Payment, Document, Activity } from '@/types/employees';
import { useToast } from '@/components/ui/use-toast';

// Query key factory for consistent caching
export const employeeKeys = {
    all: ['employees'] as const,
    lists: () => [...employeeKeys.all, 'list'] as const,
    list: (filters: { page: number; limit: number; search?: string; departmentId?: string }) => [...employeeKeys.lists(), filters] as const,
    details: () => [...employeeKeys.all, 'detail'] as const,
    detail: (id: string) => [...employeeKeys.details(), id] as const,
    payments: (id: string) => [...employeeKeys.detail(id), 'payments'] as const,
    documents: (id: string) => [...employeeKeys.detail(id), 'documents'] as const,
    activities: (id: string) => [...employeeKeys.detail(id), 'activities'] as const,
};

interface ApiEmployee {
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
    phoneNumber?: string;
    departmentId?: string;
    department?: { id: string; name: string; code: string };
    tcNo: string;
    status?: string;
    avatarUrl?: string;
    company?: { id: string; name: string };
    companyId: string;
    _count?: { policies: number };
    policies?: unknown[];
    createdAt: string;
    updatedAt: string;
}

interface PaginatedEmployees {
    data: Employee[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export const useEmployees = (params: { page: number; limit: number; search?: string; departmentId?: string }) => {
    return useQuery<PaginatedEmployees>({
        queryKey: employeeKeys.list(params),
        queryFn: async () => {
            const { data } = await api.get('/employees', { params });
            // Transform API data to match Employee interface
            const transformedData = data.data.map((item: ApiEmployee) => ({
                id: item.id,
                firstName: item.firstName,
                lastName: item.lastName,
                fullName: `${item.firstName} ${item.lastName}`,
                email: item.email ?? '',
                phoneNumber: item.phoneNumber,
                departmentId: item.departmentId,
                department: item.department,
                departmentName: item.department?.name,
                tcNo: item.tcNo,
                status: ((item.status || 'ACTIVE').toUpperCase()) as 'ACTIVE' | 'INACTIVE' | 'PENDING',
                activePoliciesCount: item._count?.policies ?? item.policies?.length ?? 0,
                avatarUrl: item.avatarUrl,
                company: item.company,
                companyId: item.companyId,
                createdAt: item.createdAt,
                updatedAt: item.updatedAt
            }));

            return {
                data: transformedData as Employee[],
                total: data.total,
                page: data.page,
                limit: data.limit,
                totalPages: data.totalPages
            };
        },
    });
};

export const useEmployee = (id: string) => {
    return useQuery<Employee>({
        queryKey: employeeKeys.detail(id),
        queryFn: async () => {
            const { data } = await api.get(`/employees/${id}`);
            return {
                ...data,
                fullName: data.fullName || `${data.firstName} ${data.lastName}`,
            } as Employee;
        },
        enabled: !!id,
    });
};

// Moved generic Policy hooks to usePolicies.ts
// Keeping specific sub-resource hooks if they are unique, but useEmployeePolicies was just a wrapper.

export const useEmployeePayments = (id: string) => {
    return useQuery<Payment[]>({
        queryKey: employeeKeys.payments(id),
        queryFn: async () => {
            const { data } = await api.get(`/payments`, { params: { employeeId: id } });
            return data?.data as Payment[];
        },
        enabled: !!id,
    });
};

export const useEmployeeDocuments = (id: string) => {
    return useQuery<Document[]>({
        queryKey: employeeKeys.documents(id),
        queryFn: async () => {
            const { data } = await api.get(`/documents`, { params: { employeeId: id } });
            return data as Document[];
        },
        enabled: !!id,
    });
};

export const useEmployeeActivities = (id: string) => {
    return useQuery<Activity[]>({
        queryKey: employeeKeys.activities(id),
        queryFn: async () => {
            const { data } = await api.get(`/activities`, { params: { employeeId: id } });
            return data as Activity[];
        },
        enabled: !!id,
    });
};

export const useCreateEmployee = () => {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: async (newEmployee: Partial<Employee>) => {
            const { data } = await api.post('/employees', newEmployee);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: employeeKeys.all });
            toast({ title: "Başarılı", description: "Çalışan oluşturuldu" });
        },
        onError: () => {
            toast({
                title: "Hata",
                description: "Çalışan oluşturulurken bir hata oluştu",
                className: "bg-red-50 border-red-200 text-red-900"
            });
        }
    });
};

export const useUpdateEmployee = () => {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: async ({ id, ...data }: Partial<Employee> & { id: string }) => {
            const { data: response } = await api.patch(`/employees/${id}`, data);
            return response;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: employeeKeys.all });
            queryClient.invalidateQueries({ queryKey: employeeKeys.detail(variables.id) });
            toast({ title: "Başarılı", description: "Çalışan güncellendi" });
        },
        onError: () => {
            toast({
                title: "Hata",
                description: "Çalışan güncellenemedi",
                className: "bg-red-50 border-red-200 text-red-900"
            });
        }
    });
};

export const useDeleteEmployee = () => {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: async (id: string) => {
            await api.delete(`/employees/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: employeeKeys.all });
            toast({ title: "Başarılı", description: "Çalışan silindi" });
        },
        onError: () => {
            toast({
                title: "Hata",
                description: "Çalışan silinemedi",
                className: "bg-red-50 border-red-200 text-red-900"
            });
        }
    });
};

export const useUploadDocument = () => {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: async ({ employeeId, file }: { employeeId: string; file: File }) => {
            const formData = new FormData();
            formData.append('file', file);
            const { data } = await api.post(`/employees/${employeeId}/upload`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            return data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: employeeKeys.documents(variables.employeeId) });
            toast({ title: "Başarılı", description: "Belge yüklendi" });
        },
        onError: () => {
            toast({
                title: "Hata",
                description: "Belge yüklenirken bir hata oluştu",
                className: "bg-red-50 border-red-200 text-red-900"
            });
        }
    });
};

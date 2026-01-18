import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';

export interface Company {
    id: string;
    name: string;
    taxId?: string;
    address?: string;
    city?: string;
    email?: string;
    phone?: string;
    website?: string;
    sector?: string;
    employeeCount?: number;
    createdAt?: string;
    updatedAt?: string;
}

export interface Employee {
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
    phoneNumber?: string;
}

export interface CompanyQueryParams {
    page?: number;
    limit?: number;
    search?: string;
}

export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export function useCompanies(params?: CompanyQueryParams) {
    return useQuery<PaginatedResponse<Company> | Company[]>({
        queryKey: ['companies', params],
        queryFn: async () => {
            const { data } = await api.get('/companies', { params });
            return data;
        },
    });
}

export function useCompany(id: string) {
    return useQuery({
        queryKey: ['companies', id],
        queryFn: async () => {
            const { data } = await api.get(`/companies/${id}`);
            return data as Company;
        },
        enabled: !!id
    });
}

export function useCreateCompany() {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: async (data: Partial<Company>) => {
            const { data: response } = await api.post('/companies', data);
            return response as Company;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['companies'] });
            toast({ title: 'Başarılı', description: 'Şirket eklendi' });
        },
        onError: () => {
            toast({ title: 'Hata', description: 'Şirket eklenirken bir hata oluştu', className: 'bg-red-50 border-red-200 text-red-900' });
        }
    });
}

export function useUpdateCompany() {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: async ({ id, data }: { id: string; data: Partial<Company> }) => {
            const { data: response } = await api.patch(`/companies/${id}`, data);
            return response as Company;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['companies'] });
            toast({ title: 'Başarılı', description: 'Şirket güncellendi' });
        },
        onError: () => {
            toast({ title: 'Hata', description: 'Şirket güncellenirken bir hata oluştu', className: 'bg-red-50 border-red-200 text-red-900' });
        }
    });
}

export function useDeleteCompany() {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: async (id: string) => {
            await api.delete(`/companies/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['companies'] });
            toast({ title: 'Başarılı', description: 'Şirket silindi' });
        },
        onError: () => {
            toast({ title: 'Hata', description: 'Şirket silinirken bir hata oluştu', className: 'bg-red-50 border-red-200 text-red-900' });
        }
    });
}

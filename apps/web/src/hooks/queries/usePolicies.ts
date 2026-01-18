import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';

// Query key factory for consistent caching
export const policyKeys = {
    all: ['policies'] as const,
    lists: () => [...policyKeys.all, 'list'] as const,
    list: (filters: Record<string, unknown>) => [...policyKeys.lists(), filters] as const,
    details: () => [...policyKeys.all, 'detail'] as const,
    detail: (id: string) => [...policyKeys.details(), id] as const,
};

export interface Policy {
    id: string;
    policyNo: string;
    type: 'TSS' | 'OSS' | 'LIFE' | 'FERDI_KAZA';
    startDate: string;
    endDate: string;
    premium?: number;
    status: 'ACTIVE' | 'CANCELLED' | 'PENDING_RENEWAL' | 'EXPIRED';
    company?: { id: string; name: string };
    employee?: { id: string; firstName: string; lastName: string };
}

export interface PaginatedPolicies {
    data: Policy[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export function usePolicies(params?: Record<string, unknown>) {
    return useQuery<PaginatedPolicies>({
        queryKey: policyKeys.list(params ?? {}),
        queryFn: async () => {
            const { data } = await api.get('/policies', { params });
            return data;
        }
    });
}

export function usePolicy(id: string) {
    return useQuery({
        queryKey: policyKeys.detail(id),
        queryFn: async () => {
            const { data } = await api.get(`/policies/${id}`);
            return data as Policy;
        },
        enabled: !!id
    });
}

export function useCreatePolicy() {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: async (data: Partial<Policy>) => {
            const { data: response } = await api.post('/policies', data);
            return response;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: policyKeys.all });
            toast({ title: 'Başarılı', description: 'Poliçe oluşturuldu' });
        },
        onError: () => {
            toast({ title: 'Hata', description: 'Poliçe oluşturulurken bir hata oluştu', className: 'bg-red-50 border-red-200 text-red-900' });
        }
    });
}

export function useDeletePolicy() {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: async (id: string) => {
            await api.delete(`/policies/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: policyKeys.all });
            toast({ title: 'Başarılı', description: 'Poliçe silindi' });
        },
        onError: () => {
            toast({ title: 'Hata', description: 'Poliçe silinirken bir hata oluştu', className: 'bg-red-50 border-red-200 text-red-900' });
        }
    });
}

export function useAssignPolicy() {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: async ({ policyId, employeeId }: { policyId: string; employeeId: string }) => {
            const { data } = await api.patch(`/policies/${policyId}/assign`, { employeeId });
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: policyKeys.all });
            toast({ title: 'Başarılı', description: 'Poliçe atandı' });
        },
        onError: () => {
            toast({ title: 'Hata', description: 'Poliçe atanırken bir hata oluştu', className: 'bg-red-50 border-red-200 text-red-900' });
        }
    });
}

export function useEmployeePolicies(employeeId: string) {
    return usePolicies({ employeeId });
}


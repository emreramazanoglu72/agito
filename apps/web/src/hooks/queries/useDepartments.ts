import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Department } from '@/types/departments';

export const useDepartments = (params: { page: number; limit: number; search?: string; companyId?: string; isActive?: boolean }) => {
    return useQuery({
        queryKey: ['departments', params],
        queryFn: async () => {
            const { data } = await api.get('/departments', { params });
            return data as { data: Department[]; total: number; page: number; limit: number; totalPages: number };
        },
    });
};

export const useCreateDepartment = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (payload: Partial<Department>) => {
            const { data } = await api.post('/departments', payload);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['departments'] });
        },
    });
};

export const useUpdateDepartment = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, ...payload }: Partial<Department> & { id: string }) => {
            const { data } = await api.patch(`/departments/${id}`, payload);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['departments'] });
        },
    });
};

export const useDeleteDepartment = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            await api.delete(`/departments/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['departments'] });
        },
    });
};

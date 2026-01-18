import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface PaymentStats {
    total: number;
    collected: number;
    pending: number;
    overdue: number;
    totalCount?: number;
}

export function usePayments(params?: any) {
    return useQuery<any>({
        queryKey: ['payments', params],
        queryFn: async () => {
            const { data } = await api.get('/payments', { params });
            // Expected backend response structure from PaymentsPage usage:
            // { data: Payment[], meta: { lastPage: number, total: number }, summary: PaymentStats }
            return data;
        }
    });
}

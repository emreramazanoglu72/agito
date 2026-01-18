import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

// --- Types ---
export interface Stats {
    totalPolicies: number;
    totalCompanies: number;
    totalEmployees: number;
    activePolicies: number;
    pendingRenewals: number;
    renewedThisMonth: number;
    totalPremium: number;
}

export interface OperationsStats {
    slaTarget: number;
    avgProcessingHours: number;
    successRate: number;
    backlog: number;
}

export interface DashboardAnalytics {
    stats: Stats;
    changes: {
        renewedThisMonth: { value: string; tone: 'positive' | 'negative' | 'neutral' };
        totalPremium: { value: string; tone: 'positive' | 'negative' | 'neutral' };
    };
    operations: OperationsStats;
    chart: {
        labels: string[];
        datasets: Array<{
            label: string;
            data: number[];
            fill: boolean;
            borderColor: string;
            backgroundColor: string;
            tension: number;
        }>;
    };
    doughnut: {
        labels: string[];
        datasets: Array<{
            data: number[];
            backgroundColor: string[];
            hoverBackgroundColor: string[];
            borderWidth: number;
        }>;
    };
}

export interface CustomerDashboardData {
    policies: any[];
    employees: any[];
    overduePayments: any[];
    activities: any[];
    summary: {
        policies: number;
        employees: number;
        overdue: number;
        totalPremium: number;
    };
}

// --- Admin Dashboard Hook ---
export function useAdminDashboardStats(range: '6m' | '12m') {
    return useQuery({
        queryKey: ['dashboard', 'admin', range],
        queryFn: async () => {
            const { data } = await api.get<DashboardAnalytics>('/analytics/dashboard', {
                params: { range }
            });
            return data;
        },
        staleTime: 5 * 60 * 1000 // 5 minutes
    });
}

// --- Customer Dashboard Hook ---
export function useCustomerDashboardStats(companyId?: string | null) {
    return useQuery({
        queryKey: ['dashboard', 'customer', companyId],
        queryFn: async () => {
            const params = companyId ? { companyId } : {};
            const limit = 6;

            const [policiesRes, paymentsRes, employeesRes, activitiesRes] = await Promise.all([
                api.get('/policies', { params: { ...params, limit } }),
                api.get('/payments', { params: { ...params, limit, status: 'OVERDUE' } }),
                api.get('/employees', { params: { ...params, limit } }),
                api.get('/activities', { params: { ...params, limit } })
            ]);

            const policies = policiesRes.data?.data ?? [];
            const employees = employeesRes.data?.data ?? [];
            const overduePayments = paymentsRes.data?.data ?? [];
            const activities = activitiesRes.data ?? [];

            return {
                policies,
                employees,
                overduePayments,
                activities,
                summary: {
                    policies: policiesRes.data?.total ?? policies.length,
                    employees: employeesRes.data?.total ?? employees.length,
                    overdue: paymentsRes.data?.summary?.overdue ?? overduePayments.length,
                    totalPremium: paymentsRes.data?.summary?.total ?? 0
                }
            } as CustomerDashboardData;
        },
        staleTime: 2 * 60 * 1000 // 2 minutes
    });
}

// --- Shared Activities Hook ---
export function useRecentActivities(limit = 5) {
    return useQuery({
        queryKey: ['activities', 'recent', limit],
        queryFn: async () => {
            const { data } = await api.get('/activities', { params: { limit } });
            return data as any[];
        },
        staleTime: 30 * 1000 // 30 seconds
    });
}

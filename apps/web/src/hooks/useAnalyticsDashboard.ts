"use client";
import useSWR from 'swr';
import { api } from '@/lib/api';

const fetcher = (url: string) => api.get(url).then(res => res.data);

export function useAnalyticsDashboard(range?: string) {
  const { data, error, isLoading } = useSWR(
    `/analytics/dashboard${range ? `?range=${range}` : ''}`,
    fetcher,
    { refreshInterval: 60000 }
  );
  return {
    data,
    isLoading,
    isError: !!error,
  };
}

import React from 'react';
import { Employee } from '@/types/employees';
import { EmployeeCard } from '@/components/molecules/EmployeeCard';
import { cn } from '@/lib/utils';

interface EmployeeGridProps {
    employees: Employee[];
    loading?: boolean;
    className?: string;
    onEdit?: (employee: Employee) => void;
    onDelete?: (employee: Employee) => void;
}

export const EmployeeGrid: React.FC<EmployeeGridProps> = ({ employees, loading, className, onEdit, onDelete }) => {
    if (loading) {
        return (
            <div className={cn("grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4", className)}>
                {Array.from({ length: 8 }).map((_, i) => (
                    <div
                        key={i}
                        className="h-[300px] animate-pulse rounded-2xl bg-slate-100"
                    />
                ))}
            </div>
        );
    }

    if (employees.length === 0) {
        return (
            <div className="flex h-[300px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 p-12 text-center">
                <div className="rounded-full bg-slate-50 p-4">
                    <svg className="h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                </div>
                <h3 className="mt-4 text-lg font-semibold text-slate-900">Çalışan Bulunamadı</h3>
                <p className="mt-2 text-sm text-slate-500">Arama kriterlerinizi değiştirerek tekrar deneyebilirsiniz.</p>
            </div>
        );
    }

    return (
        <div className={cn("grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4", className)}>
            {employees.map((employee) => (
                <EmployeeCard
                    key={employee.id}
                    employee={employee}
                    onEdit={onEdit}
                    onDelete={onDelete}
                />
            ))}
        </div>
    );
};

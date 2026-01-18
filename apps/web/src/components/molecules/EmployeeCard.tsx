import React from 'react';
import { Employee } from '@/types/employees';
import { cn } from '@/lib/utils';
import { EmployeeAvatar } from '@/components/atoms/EmployeeAvatar';
import { StatusBadge } from '@/components/atoms/StatusBadge';
import { Shield, Briefcase, Mail, ArrowUpRight, Edit3, Trash2, CreditCard } from 'lucide-react';
import Link from 'next/link';
import { Button } from '../atoms/Button';

interface EmployeeCardProps {
    employee: Employee;
    onEdit?: (employee: Employee) => void;
    onDelete?: (employee: Employee) => void;
}

export const EmployeeCard: React.FC<EmployeeCardProps> = ({ employee, onEdit, onDelete }) => {
    return (
        <div className="group relative flex flex-col rounded-3xl border border-slate-100 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200/50">
            {/* Action Buttons */}
            <div className="absolute right-4 top-4 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                {onEdit && (
                    <button
                        onClick={() => onEdit(employee)}
                        className="rounded-full p-2 text-slate-400 hover:bg-slate-50 hover:text-teal-600 transition-colors"
                        title="Düzenle"
                    >
                        <Edit3 className="h-4 w-4" />
                    </button>
                )}
                {onDelete && (
                    <button
                        onClick={() => onDelete(employee)}
                        className="rounded-full p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                        title="Sil"
                    >
                        <Trash2 className="h-4 w-4" />
                    </button>
                )}
            </div>

            <div className="mb-6 flex flex-col items-center text-center">
                <EmployeeAvatar
                    src={employee.avatarUrl}
                    name={employee.fullName || `${employee.firstName} ${employee.lastName}`}
                    className="h-20 w-20 text-xl border-4 border-white shadow-xl"
                />
                <h3 className="mt-4 text-lg font-bold text-slate-900 line-clamp-1">
                    {employee.fullName || `${employee.firstName} ${employee.lastName}`}
                </h3>
                <div className="mt-1 text-sm font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                    {employee.department?.name || '-'}
                </div>
            </div>

            <div className="space-y-3 w-full">
                <div className="flex items-center justify-between text-sm group/item">
                    <div className="flex items-center text-slate-500 gap-2">
                        <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 transition-colors group-hover/item:bg-indigo-100">
                            <Mail className="h-3.5 w-3.5" />
                        </div>
                        <span className="font-medium">E-posta</span>
                    </div>
                    <span className="font-semibold text-slate-700 max-w-[120px] truncate" title={employee.email}>
                        {employee.email}
                    </span>
                </div>

                <div className="flex items-center justify-between text-sm group/item">
                    <div className="flex items-center text-slate-500 gap-2">
                        <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600 transition-colors group-hover/item:bg-blue-100">
                            <CreditCard className="h-3.5 w-3.5" />
                        </div>
                        <span className="font-medium">Kimlik No</span>
                    </div>
                    <span className="font-mono font-semibold text-slate-700 tracking-wide bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                        {employee.tcNo}
                    </span>
                </div>

                <div className="flex items-center justify-between text-sm group/item pt-2 border-t border-slate-50">
                    <div className="flex items-center text-slate-500 gap-2">
                        <div className="p-1.5 rounded-lg bg-teal-50 text-teal-600 transition-colors group-hover/item:bg-teal-100">
                            <Shield className="h-3.5 w-3.5" />
                        </div>
                        <span className="font-medium">Aktif Poliçe</span>
                    </div>
                    <span className={cn(
                        "font-bold px-2.5 py-1 rounded-full text-xs shadow-sm transition-transform group-hover/item:scale-105",
                        employee.activePoliciesCount > 0
                            ? "bg-teal-50 text-teal-700 border border-teal-100"
                            : "bg-slate-100 text-slate-500"
                    )}>
                        {employee.activePoliciesCount || 0} Adet
                    </span>
                </div>
            </div>

            <Link
                href={`/dashboard/employees/${employee.id}`}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-50 py-3 text-sm font-bold text-slate-700 transition-all hover:bg-slate-900 hover:text-white"
            >
                Detayları Görüntüle
                <ArrowUpRight className="h-4 w-4" />
            </Link>
        </div>
    );
};

'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useEmployee } from '@/hooks/queries/useEmployees';
import { EmployeeAvatar } from '@/components/atoms/EmployeeAvatar';
import { StatusBadge } from '@/components/atoms/StatusBadge';
import { EmployeeDetailTabs } from '@/components/organisms/EmployeeDetailTabs';
import { Button } from '@/components/atoms/Button';
import { ArrowLeft, Mail, Phone, Building2 } from 'lucide-react';

export default function CustomerEmployeeDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const { data: employee, isLoading } = useEmployee(id as string);

    const formatDate = (value?: string) => {
        if (!value) return '-';
        const date = new Date(value);
        return Number.isNaN(date.getTime()) ? '-' : date.toLocaleDateString('tr-TR');
    };

    if (isLoading) {
        return (
            <div className="flex flex-col gap-8 animate-pulse">
                <div className="h-48 rounded-[40px] bg-slate-100" />
                <div className="h-[500px] rounded-3xl bg-slate-50" />
            </div>
        );
    }

    if (!employee) {
        return (
            <div className="flex h-[400px] flex-col items-center justify-center text-center">
                <h2 className="text-2xl font-bold">Calisan bulunamadi</h2>
                <Button variant="link" onClick={() => router.back()}>Geri Don</Button>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-8">
            <header className="relative overflow-hidden rounded-[40px] bg-[radial-gradient(120%_120%_at_10%_15%,_#0f766e_0%,_#0b1220_55%,_#0a0f1c_100%)] p-8 text-white shadow-2xl shadow-teal-900/20">
                <div className="absolute -right-24 -top-20 h-96 w-96 rounded-full bg-teal-300/10 blur-[100px]"></div>

                <div className="relative z-10">
                    <button
                        onClick={() => router.push('/customer/employees')}
                        className="mb-6 flex items-center gap-2 text-sm font-medium text-white/60 transition-colors hover:text-white"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Calisan listesine don
                    </button>

                    <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
                        <div className="flex flex-col gap-6 md:flex-row md:items-center">
                            <EmployeeAvatar
                                src={employee.avatarUrl}
                                name={employee.fullName || `${employee.firstName} ${employee.lastName}`}
                                className="h-24 w-24 rounded-3xl border-4 border-white/10"
                            />
                            <div>
                                <div className="flex items-center gap-3">
                                    <h1 className="text-3xl font-bold">{employee.fullName || `${employee.firstName} ${employee.lastName}`}</h1>
                                    <StatusBadge status={employee.status} />
                                </div>
                                <div className="mt-3 flex flex-wrap gap-4 text-sm text-white/70">
                                    <div className="flex items-center gap-2">
                                        <Building2 className="h-4 w-4" />
                                        {employee.department?.name || '-'}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Mail className="h-4 w-4" />
                                        {employee.email || '-'}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Phone className="h-4 w-4" />
                                        {employee.phoneNumber || '-'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <div className="grid gap-8 lg:grid-cols-4">
                <div className="lg:col-span-1 space-y-6">
                    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                        <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400">Genel Bilgiler</h3>
                        <div className="mt-6 space-y-4">
                            <div>
                                <div className="text-xs text-slate-400">TC Kimlik No</div>
                                <div className="mt-1 font-semibold">{employee.tcNo}</div>
                            </div>
                            <div>
                                <div className="text-xs text-slate-400">Kurum</div>
                                <div className="mt-1 font-semibold">{employee.company?.name || '-'}</div>
                            </div>
                            <div>
                                <div className="text-xs text-slate-400">Kayit tarihi</div>
                                <div className="mt-1 font-semibold">{formatDate(employee.createdAt)}</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-3">
                    <EmployeeDetailTabs employeeId={employee.id} companyId={employee.companyId} />
                </div>
            </div>
        </div>
    );
}

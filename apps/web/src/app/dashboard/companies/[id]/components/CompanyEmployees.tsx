'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

type EmployeeRow = {
    id: string;
    firstName: string;
    lastName: string;
    department?: { name?: string };
    company?: { name?: string };
    createdAt: string;
    _count?: { policies?: number };
};

type PolicyRow = {
    id: string;
    policyNo: string;
    status: string;
    type: string;
    employee?: { firstName?: string; lastName?: string; id?: string };
    createdAt: string;
};

export const CompanyEmployees = ({ companyId }: { companyId: string }) => {
    const router = useRouter();
    const pageSize = 6;
    const [employees, setEmployees] = useState<EmployeeRow[]>([]);
    const [employeeTotal, setEmployeeTotal] = useState(0);
    const [employeePage, setEmployeePage] = useState(1);
    const [policies, setPolicies] = useState<PolicyRow[]>([]);
    const [policyTotal, setPolicyTotal] = useState(0);
    const [policyPage, setPolicyPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        const fetchDetails = async () => {
            setLoading(true);
            setError(null);
            try {
                const [employeeRes, policyRes] = await Promise.all([
                    api.get('/employees', { params: { companyId, limit: pageSize, page: employeePage } }),
                    api.get('/policies', { params: { companyId, limit: pageSize, page: policyPage } })
                ]);

                if (cancelled) return;

                setEmployees(employeeRes.data.data ?? []);
                setEmployeeTotal(employeeRes.data.total ?? 0);
                setPolicies(policyRes.data.data ?? []);
                setPolicyTotal(policyRes.data.total ?? 0);
            } catch (err) {
                if (cancelled) return;
                console.error('Company employees fetch failed', err);
                setError('Veri yüklenirken hata oluştu');
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        fetchDetails();
        return () => {
            cancelled = true;
        };
    }, [companyId, employeePage, policyPage]);

    const statusColumns = useMemo(() => {
        const counts: Record<string, number> = {
            ACTIVE: 0,
            PENDING_RENEWAL: 0,
            CANCELLED: 0,
            EXPIRED: 0
        };
        policies.forEach((policy) => {
            if (!counts[policy.status]) {
                counts[policy.status] = 0;
            }
            counts[policy.status] += 1;
        });
        return counts;
    }, [policies]);

    const averagePoliciesPerEmployee = useMemo(() => {
        if (!employees.length) return 0;
        const total = employees.reduce((sum, employee) => sum + (employee._count?.policies || 0), 0);
        return Math.round(total / employees.length);
    }, [employees]);

    const statusLabel: Record<string, string> = {
        ACTIVE: 'Aktif',
        PENDING_RENEWAL: 'Yenileme Bekliyor',
        CANCELLED: 'İptal',
        EXPIRED: 'Süresi Dolmuş'
    };

    const employeeStart = employeeTotal === 0 ? 0 : (employeePage - 1) * pageSize + 1;
    const employeeEnd = Math.min(employeeTotal, employeePage * pageSize);
    const policyStart = policyTotal === 0 ? 0 : (policyPage - 1) * pageSize + 1;
    const policyEnd = Math.min(policyTotal, policyPage * pageSize);

    return (
        <div className="space-y-6">
            <div className="rounded-[24px] border border-slate-100 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Çalışanlar</p>
                        <h3 className="text-lg font-semibold text-slate-900">Şirkete bağlı ekip</h3>
                    </div>
                    <div className="flex items-baseline gap-2 text-xs font-semibold text-slate-500">
                        <span>{employeeTotal} çalışan kaydı</span>
                        <span className="text-slate-300">•</span>
                        <span>{averagePoliciesPerEmployee} poliçe / kişi</span>
                    </div>
                </div>
                {error && (
                    <div className="mt-4 rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-600">
                        {error}
                    </div>
                )}
                <div className="mt-4 overflow-x-auto">
                    <table className="min-w-full text-left text-sm text-slate-600">
                        <thead className="border-b border-slate-100 text-xs uppercase text-slate-400">
                            <tr>
                                <th className="px-4 py-3">Çalışan</th>
                                <th className="px-4 py-3">Departman</th>
                                <th className="px-4 py-3 text-center">Poliçeler</th>
                                <th className="px-4 py-3 text-center">Kayıt</th>
                                <th className="px-4 py-3 text-right">Eylem</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading && (
                                <tr>
                                    <td colSpan={5} className="px-4 py-8 text-center text-xs text-slate-400">
                                        Yükleniyor...
                                    </td>
                                </tr>
                            )}
                            {!loading && employees.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-4 py-8 text-center text-xs text-slate-400">
                                        Henüz çalışan bulunamadı.
                                    </td>
                                </tr>
                            )}
                            {!loading &&
                                employees.map((employee) => (
                                    <tr key={employee.id} className="group hover:bg-slate-50 transition-colors">
                                        <td
                                            className="px-4 py-4 cursor-pointer"
                                            onClick={() => router.push(`/dashboard/employees/${employee.id}`)}
                                        >
                                            <div className="text-sm font-semibold text-slate-900 group-hover:text-blue-600">
                                                {employee.firstName} {employee.lastName}
                                            </div>
                                            <p className="text-[11px] text-slate-400">
                                                {employee.company?.name ?? 'Şirket bilgisi yok'}
                                            </p>
                                        </td>
                                        <td className="px-4 py-4">
                                            {employee.department?.name ?? 'Departman atanmadı'}
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            <span className="text-sm font-semibold text-slate-900">{employee._count?.policies ?? 0}</span>
                                        </td>
                                        <td className="px-4 py-4 text-center text-xs text-slate-500">
                                            {format(new Date(employee.createdAt), 'dd MMM yyyy', { locale: tr })}
                                        </td>
                                        <td className="px-4 py-4 text-right">
                                            <button
                                                onClick={() => router.push(`/dashboard/employees/${employee.id}`)}
                                                className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 hover:border-slate-300"
                                            >
                                                Detaya git
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                        </tbody>
                    </table>
                </div>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
                    <span>
                        {employeeStart}-{employeeEnd} / {employeeTotal}
                    </span>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setEmployeePage((prev) => Math.max(1, prev - 1))}
                            disabled={employeePage <= 1}
                            className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 hover:border-slate-300 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            Önceki
                        </button>
                        <button
                            type="button"
                            onClick={() => setEmployeePage((prev) => prev + 1)}
                            disabled={employeePage * pageSize >= employeeTotal}
                            className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 hover:border-slate-300 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            Sonraki
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
                <div className="rounded-[24px] border border-slate-100 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Poliçeler</p>
                            <h3 className="text-lg font-semibold text-slate-900">Şirket içindeki son poliçeler</h3>
                        </div>
                        <span className="text-xs font-semibold text-slate-500">{policyTotal} kayıt</span>
                    </div>
                    {policies.length === 0 ? (
                        <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                            Görüntülenebilecek poliçe bulunamadı.
                        </div>
                    ) : (
                        <div className="mt-4 space-y-3">
                            {policies.map((policy) => (
                                <button
                                    key={policy.id}
                                    onClick={() => router.push(`/dashboard/policies/${policy.id}`)}
                                    className="flex w-full flex-col gap-1 rounded-[16px] border border-slate-100 bg-slate-50 px-4 py-3 text-left hover:border-slate-300 hover:bg-white transition-colors"
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-semibold text-slate-900">{policy.policyNo}</span>
                                        <Badge
                                            variant={
                                                policy.status === 'ACTIVE'
                                                    ? 'success'
                                                    : policy.status === 'PENDING_RENEWAL'
                                                        ? 'warning'
                                                        : 'danger'
                                            }
                                        >
                                            {statusLabel[policy.status] ?? policy.status}
                                        </Badge>
                                    </div>
                                    <p className="text-xs text-slate-500">
                                        {policy.employee ? `${policy.employee.firstName} ${policy.employee.lastName}` : 'Çalışan bilgisi yok'} • {policy.type}
                                    </p>
                                    <p className="text-[11px] text-slate-400">
                                        Oluşturma tarihi {format(new Date(policy.createdAt), 'd MMM yyyy', { locale: tr })}
                                    </p>
                                </button>
                            ))}
                        </div>
                    )}
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
                        <span>
                            {policyStart}-{policyEnd} / {policyTotal}
                        </span>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setPolicyPage((prev) => Math.max(1, prev - 1))}
                                disabled={policyPage <= 1}
                                className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 hover:border-slate-300 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Önceki
                            </button>
                            <button
                                type="button"
                                onClick={() => setPolicyPage((prev) => prev + 1)}
                                disabled={policyPage * pageSize >= policyTotal}
                                className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 hover:border-slate-300 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Sonraki
                            </button>
                        </div>
                    </div>
                </div>
                <div className="rounded-[24px] border border-slate-100 bg-white p-5 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Durum Dağılımı</p>
                    <div className="mt-4 grid grid-cols-2 gap-3">
                        {Object.entries(statusColumns).map(([status, count]) => (
                            <div key={status} className="rounded-2xl border border-slate-100/70 bg-slate-50 px-4 py-3 text-center text-xs font-semibold text-slate-600">
                                <div>{statusLabel[status] ?? status}</div>
                                <div className="mt-1 text-2xl text-slate-900">{count}</div>
                            </div>
                        ))}
                    </div>
                    <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-500">
                        Son poliçe: {policies[0]?.policyNo ?? 'Yok'} • Ortalama {averagePoliciesPerEmployee} poliçe / kişi
                    </div>
                </div>
            </div>
        </div>
    );
};

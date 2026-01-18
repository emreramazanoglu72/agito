'use client';

import React, { useMemo } from 'react';
import { useRouter } from 'next/navigation';

import { CrudManager } from '@/components/organisms/dynamic-crud/CrudManager';
import { CrudConfig } from '@/components/organisms/dynamic-crud/types';
import { Badge } from '@/components/ui/badge';
import {
    usePolicies,
    useCreatePolicy,
    useDeletePolicy,
    Policy
} from '@/hooks/queries/usePolicies';

interface PolicyRow {
    id: string;
    policyNumber: string;
    company: string;
    employee: string;
    type: Policy['type'];
    startDate: string | Date;
    premium?: number;
    status: Policy['status'];
    // Optional form fields
    companyId?: string;
    employeeId?: string;
    endDate?: string | Date;
}

const POLICY_STATUS_COLORS = {
    ACTIVE: 'success',
    CANCELLED: 'danger',
    PENDING_RENEWAL: 'warning',
    EXPIRED: 'secondary'
} as const;

export default function PoliciesPage() {
    const router = useRouter();

    const { data: policiesData, isLoading } = usePolicies({ limit: 100 });
    const { mutate: createPolicy } = useCreatePolicy();
    const { mutate: deletePolicy } = useDeletePolicy();

    const tableData = useMemo<PolicyRow[]>(() => {
        return (policiesData?.data || []).map((policy) => ({
            id: policy.id,
            policyNumber: policy.policyNo,
            company: policy.company?.name || 'Bilinmiyor',
            employee: policy.employee ? `${policy.employee.firstName} ${policy.employee.lastName}` : '-',
            type: policy.type,
            startDate: new Date(policy.startDate).toLocaleDateString('tr-TR'),
            premium: policy.premium,
            status: policy.status
        }));
    }, [policiesData]);

    const totalRecords = policiesData?.total || 0;

    const normalizeDate = (value: Date | string | undefined | null) => {
        if (!value) return value;
        return value instanceof Date ? value.toISOString() : String(value);
    };

    const handleSave = async (values: Partial<PolicyRow>) => {
        if (!values.employeeId) {
            console.error('Validation: Employee ID missing');
            return;
        }

        const payload = {
            employeeId: values.employeeId,
            type: values.type,
            startDate: normalizeDate(values.startDate) as string,
            endDate: normalizeDate(values.endDate) as string
        };

        createPolicy(payload);
    };

    const handleDelete = (row: PolicyRow) => {
        if (confirm('Poliçeyi silmek istediğinize emin misiniz?')) {
            deletePolicy(row.id);
        }
    };

    const config: CrudConfig<PolicyRow> = {
        title: 'Poliçe Listesi',
        description: 'Tüm sigorta poliçelerini görüntüleyin.',
        endpoint: '/policies',
        viewMode: 'sidebar',
        table: {
            columns: [
                { field: 'policyNumber', header: 'Poliçe No', sortable: true },
                { field: 'company', header: 'Şirket', sortable: true },
                { field: 'employee', header: 'Çalışan', sortable: true },
                { field: 'type', header: 'Tür', sortable: true },
                { field: 'startDate', header: 'Başlangıç', sortable: true },
                { field: 'premium', header: 'Prim (TL)', sortable: true },
                {
                    field: 'status',
                    header: 'Durum',
                    sortable: true,
                    body: (row) => (
                        <Badge variant={POLICY_STATUS_COLORS[row.status as keyof typeof POLICY_STATUS_COLORS] || 'default'}>
                            {row.status}
                        </Badge>
                    )
                },
                {
                    field: 'actions',
                    header: '',
                    body: (row) => (
                        <button
                            onClick={() => router.push(`/dashboard/policies/${row.id}`)}
                            className="text-indigo-600 hover:text-indigo-800 text-sm font-medium transition-colors"
                        >
                            Detay
                        </button>
                    )
                }
            ]
        },
        form: {
            schema: [
                {
                    name: 'companyId',
                    label: 'Şirket',
                    type: 'select',
                    serviceOptions: {
                        endpoint: '/companies',
                        labelKey: 'name',
                        valueKey: 'id'
                    },
                    colSpan: 6
                },
                {
                    name: 'employeeId',
                    label: 'Çalışan',
                    type: 'select',
                    serviceOptions: {
                        endpoint: '/employees',
                        dependsOn: ['companyId'],
                        paramMap: { companyId: 'companyId' },
                        transform: (payload) => {
                            const list = Array.isArray(payload) ? payload : payload?.data || [];
                            return list.map((item: any) => ({
                                label: `${item.firstName} ${item.lastName}`,
                                value: item.id
                            }));
                        }
                    },
                    colSpan: 6
                },
                {
                    name: 'type',
                    label: 'Tür',
                    type: 'select',
                    options: [
                        { label: 'TSS', value: 'TSS' },
                        { label: 'OSS', value: 'OSS' },
                        { label: 'LIFE', value: 'LIFE' },
                        { label: 'FERDI_KAZA', value: 'FERDI_KAZA' }
                    ],
                    colSpan: 6
                },
                { name: 'startDate', label: 'Başlangıç', type: 'date', colSpan: 6 },
                { name: 'endDate', label: 'Bitiş', type: 'date', colSpan: 6 }
            ],
            gridClassName: 'grid grid-cols-1 md:grid-cols-2 gap-5'
        }
    };

    return (
        <div className="flex flex-col gap-6">
            <header className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-[#0f766e] via-[#0b1220] to-[#0a0f1c] p-6 text-white shadow-xl shadow-teal-900/10 transition-all hover:shadow-teal-900/20">
                <div className="absolute -right-24 -top-20 h-64 w-64 rounded-full bg-teal-300/10 blur-3xl pointer-events-none" />

                <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <div className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.3em] text-white/50 mb-2">
                            Operasyon Yönetimi
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight">
                            Poliçeler
                        </h2>
                        <p className="mt-2 text-sm text-white/70 max-w-lg leading-relaxed">
                            Tüm ürün tiplerindeki poliçeleri yönetin, yenileme süreçlerini ve ödemeleri canlı takip edin.
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-2 md:pt-0">
                        <button
                            onClick={() => router.push('/dashboard/operations')}
                            className="rounded-full bg-teal-500 px-5 py-2.5 text-xs font-bold text-white transition hover:bg-teal-400 flex items-center gap-2 shadow-lg shadow-teal-900/20 active:scale-95 transition-transform"
                        >
                            <i className="pi pi-upload" />
                            Poliçe İçe Aktar
                        </button>

                        <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-semibold text-white/90 backdrop-blur-md border border-white/5 shadow-inner">
                            <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
                            {totalRecords} Kayıt Listelendi
                        </div>
                    </div>
                </div>
            </header>

            <CrudManager
                config={config}
                data={tableData}
                loading={isLoading}
                onSave={handleSave}
                onDelete={handleDelete}
            />
        </div>
    );
}

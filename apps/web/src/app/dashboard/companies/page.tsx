'use client';

import React, { useMemo } from 'react';
import { useRouter } from 'next/navigation';

import { Badge } from '@/components/ui/badge';
import { CrudManager } from '@/components/organisms/dynamic-crud/CrudManager';
import { CrudConfig } from '@/components/organisms/dynamic-crud/types';
import {
    useCompanies,
    useCreateCompany,
    useUpdateCompany,
    useDeleteCompany,
    Company
} from '@/hooks/queries/useCompanies';

interface CompanyRow {
    id: string;
    name: string;
    contractDate: string;
    employeeCount: number;
    status: string;
    _original: Company;
}

const DEFAULT_STATUS = 'Active';

export default function CompaniesPage() {
    const router = useRouter();

    const { data: companies, isLoading } = useCompanies();

    // Mutations
    const { mutate: createCompany } = useCreateCompany();
    const { mutate: updateCompany } = useUpdateCompany();
    const { mutate: deleteCompany } = useDeleteCompany();

    const tableData = useMemo<CompanyRow[]>(() => {
        if (!companies) return [];

        return (companies as Company[]).map((company) => ({
            id: company.id,
            name: company.name,
            contractDate: new Date(company.createdAt || Date.now()).toLocaleDateString('tr-TR'),
            employeeCount: company.employeeCount || 0,
            status: DEFAULT_STATUS,
            _original: company
        }));
    }, [companies]);

    const handleSave = async (values: Partial<Company>) => {
        const payload = {
            name: values.name,
            // Future-proof: spread other potential fields
            ...values
        };

        if (values.id) {
            updateCompany({ id: values.id, data: payload });
        } else {
            createCompany(payload as Company);
        }
    };

    const handleDelete = (row: CompanyRow) => {
        if (confirm('Şirketi silmek istediğinize emin misiniz?')) {
            deleteCompany(row.id);
        }
    };

    const cardConfig: CrudConfig<CompanyRow> = {
        title: 'Şirket Listesi',
        description: 'Anlaşmalı kurumlar ve şirketlerin listesi.',
        endpoint: '/companies',
        viewMode: 'sidebar',
        table: {
            columns: [
                {
                    field: 'name',
                    header: 'Şirket Adı',
                    sortable: true,
                    body: (row) => (
                        <div className="flex align-items-center gap-2 cursor-pointer group"
                            onClick={() => router.push(`/dashboard/companies/${row.id}`)}
                        >
                            <div className="rounded bg-gray-100 flex items-center justify-center text-gray-700 font-bold text-xs h-8 w-8">
                                {row.name.substring(0, 2).toUpperCase()}
                            </div>
                            <span className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                                {row.name}
                            </span>
                        </div>
                    )
                },
                {
                    field: 'contractDate',
                    header: 'Sözleşme Tarihi',
                    sortable: true,
                },
                {
                    field: 'employeeCount',
                    header: 'Çalışan Sayısı',
                    sortable: true
                },
                {
                    field: 'status',
                    header: 'Durum',
                    sortable: true,
                    body: (row) => {
                        const variant = row.status === 'Active' ? 'success' : 'secondary';
                        return <Badge variant={variant}>{row.status}</Badge>;
                    }
                },
                {
                    field: 'actions',
                    header: '',
                    body: (row) => (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/dashboard/companies/${row.id}`);
                            }}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all"
                            title="Detayları Görüntüle"
                        >
                            <i className="pi pi-chevron-right" />
                        </button>
                    )
                }
            ]
        },
        form: {
            schema: [
                { name: 'name', label: 'Şirket Adı', type: 'text', required: true },
                {
                    name: 'status',
                    label: 'Durum',
                    type: 'select',
                    options: [
                        { label: 'Aktif', value: 'Active' },
                        { label: 'Beklemede', value: 'Pending' },
                        { label: 'Askıya Alındı', value: 'Suspended' }
                    ],
                    required: true
                },
            ]
        }
    };

    return (
        <div className="flex flex-col gap-6">
            <header className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-[#0f766e] via-[#0b1220] to-[#0a0f1c] p-6 text-white shadow-xl shadow-teal-900/10 transition-all hover:shadow-teal-900/20">
                <div className="absolute -right-24 -top-20 h-64 w-64 rounded-full bg-teal-300/10 blur-3xl pointer-events-none" />

                <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <div className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.3em] text-white/50 mb-2">
                            Müşteri Portföyü
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight">
                            Anlaşmalı Kurumlar
                        </h2>
                        <p className="mt-2 text-sm text-white/70 max-w-lg leading-relaxed">
                            Kurumsal müşterilerinizi yönetin, sözleşme detaylarını ve aktif sigortalı sayılarını takip edin.
                        </p>
                    </div>

                    <div className="inline-flex items-center gap-2 self-start rounded-full bg-white/10 px-4 py-2 text-xs font-semibold text-white/90 backdrop-blur-md border border-white/5 shadow-inner">
                        <i className="pi pi-building text-teal-300 mr-2" />
                        {tableData.length} Aktif Şirket
                    </div>
                </div>
            </header>

            <CrudManager
                config={cardConfig}
                data={tableData}
                loading={isLoading}
                onSave={handleSave}
                onDelete={handleDelete}
            />
        </div>
    );
}

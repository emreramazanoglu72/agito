'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { CrudManager } from '../../../components/organisms/dynamic-crud/CrudManager';
import { CrudConfig } from '../../../components/organisms/dynamic-crud/types';
import { Badge } from '@/components/ui/badge';
import { api } from '../../../lib/api';
import { Department } from '@/types/departments';
import { useDepartments, useCreateDepartment, useUpdateDepartment, useDeleteDepartment } from '@/hooks/queries/useDepartments';
import { useCompanies } from '@/hooks/queries/useCompanies';

export default function DepartmentsPage() {
    const [query, setQuery] = useState({
        page: 1,
        limit: 10,
        search: undefined as string | undefined,
        filters: {} as any
    });

    // Hooks
    const { data: companiesData } = useCompanies();
    const { data: departmentsData, isLoading } = useDepartments({
        page: query.page,
        limit: query.limit,
        search: query.search,
        companyId: query.filters.companyId,
        isActive: query.filters.isActive === 'true'
            ? true
            : query.filters.isActive === 'false'
                ? false
                : undefined
    });

    const createDepartmentMutation = useCreateDepartment();
    const updateDepartmentMutation = useUpdateDepartment();
    const deleteDepartmentMutation = useDeleteDepartment();

    // Derived states
    const companies = React.useMemo(() => {
        const list = (companiesData as any)?.data || (Array.isArray(companiesData) ? companiesData : []);
        return list.map((c: any) => ({ label: c.name, value: c.id }));
    }, [companiesData]);

    const data = React.useMemo(() => {
        if (!departmentsData?.data) return [];
        return departmentsData.data.map((item: any) => ({
            id: item.id,
            name: item.name,
            code: item.code,
            companyName: item.company?.name || '-',
            managerName: item.manager ? `${item.manager.firstName} ${item.manager.lastName}` : '-',
            employeeCount: item._count?.employees || 0,
            status: item.isActive ? 'Active' : 'Inactive',
            description: item.description,
            companyId: item.companyId,
            managerId: item.managerId
        }));
    }, [departmentsData]);

    const totalRecords = departmentsData?.total || 0;
    const loading = isLoading;

    // Handlers
    const onQueryChange = (newQuery: any) => {
        setQuery(prev => ({
            ...prev,
            page: newQuery.page,
            limit: newQuery.rows,
            search: newQuery.globalFilter,
            filters: { ...prev.filters, ...newQuery.filters }
        }));
    };

    const config: CrudConfig<any> = {
        title: 'Departman Listesi',
        description: 'Şirketlerin departmanlarını yönetin.',
        endpoint: '/api/departments',
        viewMode: 'sidebar',
        table: {
            serverSide: true,
            columns: [
                {
                    field: 'name',
                    header: 'Departman Adı',
                    sortable: true,
                    body: (rowData) => (
                        <div className="flex flex-col">
                            <span className="font-medium text-gray-900">{rowData.name}</span>
                            <span className="text-xs text-gray-500">{rowData.code}</span>
                        </div>
                    )
                },
                { field: 'companyName', header: 'Şirket', sortable: true },
                { field: 'managerName', header: 'Yönetici', sortable: true },
                { field: 'employeeCount', header: 'Çalışan Sayısı', sortable: true },
                {
                    field: 'status',
                    header: 'Durum',
                    sortable: true,
                    body: (rowData) => {
                        const variant = rowData.status === 'Active' ? 'success' : 'secondary';
                        return <Badge variant={variant}>{rowData.status === 'Active' ? 'Aktif' : 'Pasif'}</Badge>;
                    }
                },
            ]
        },
        cardView: {
            renderCard: (item, { onEdit, onDelete }) => (
                <div className="group relative flex flex-col justify-between overflow-hidden rounded-[20px] border border-slate-100 bg-white p-5 shadow-sm transition-all hover:shadow-md hover:border-slate-200">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                                <i className="pi pi-briefcase text-xl"></i>
                            </div>
                            <div>
                                <h3 className="text-base font-semibold text-slate-800 line-clamp-1">{item.name}</h3>
                                <span className="text-xs font-medium text-slate-400">{item.code}</span>
                            </div>
                        </div>
                        <Badge variant={item.status === 'Active' ? 'success' : 'secondary'} className="bg-slate-100 text-slate-500">
                            {item.status === 'Active' ? 'Aktif' : 'Pasif'}
                        </Badge>
                    </div>

                    <div className="mt-5 space-y-3">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-500">Şirket</span>
                            <span className="font-medium text-slate-700">{item.companyName}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-500">Yönetici</span>
                            <div className="flex items-center gap-2">
                                <div className="h-6 w-6 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-500">
                                    {item.managerName !== '-' ? item.managerName.substring(0, 1) : '-'}
                                </div>
                                <span className="font-medium text-slate-700">{item.managerName}</span>
                            </div>
                        </div>
                    </div>

                    <div className="mt-5 pt-4 border-t border-slate-50">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Çalışanlar</span>
                            <span className="text-sm font-bold text-slate-700">{item.employeeCount}</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                            <div
                                className="h-full rounded-full bg-blue-500 transition-all duration-500"
                                style={{ width: `${Math.min(item.employeeCount * 2, 100)}%` }}
                            ></div>
                        </div>
                    </div>

                    <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                            onClick={() => onEdit(item)}
                            className="h-8 w-8 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-500 hover:text-blue-600 hover:border-blue-200 transition-colors"
                        >
                            <i className="pi pi-pencil text-xs"></i>
                        </button>
                        <button
                            onClick={() => onDelete(item)}
                            className="h-8 w-8 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-500 hover:text-red-600 hover:border-red-200 transition-colors"
                        >
                            <i className="pi pi-trash text-xs"></i>
                        </button>
                    </div>
                </div>
            )
        },
        form: {
            schema: [
                { name: 'name', label: 'Departman Adı', type: 'text', required: true },
                { name: 'code', label: 'Departman Kodu', type: 'text', required: true },
                {
                    name: 'companyId',
                    label: 'Şirket',
                    type: 'select',
                    options: companies,
                    required: true
                },
                {
                    name: 'managerId',
                    label: 'Yönetici',
                    type: 'select',
                    required: false,
                    serviceOptions: {
                        endpoint: '/employees',
                        labelKey: 'firstName',
                        valueKey: 'id',
                        dependsOn: ['companyId'],
                        params: { limit: 100 },
                        transform: (res) => res.data.map((e: any) => ({
                            label: `${e.firstName} ${e.lastName}`,
                            value: e.id
                        }))
                    }
                },
                { name: 'description', label: 'Açıklama', type: 'textarea', required: false },
                {
                    name: 'isActive',
                    label: 'Durum',
                    type: 'select',
                    options: [
                        { label: 'Aktif', value: 'true' },
                        { label: 'Pasif', value: 'false' }
                    ],
                    required: true
                },
            ]
        }
    };

    return (
        <div className="flex flex-col gap-6">
            <section className="relative overflow-hidden rounded-[28px] bg-[radial-gradient(120%_120%_at_10%_15%,_#3b82f6_0%,_#0b1220_55%,_#0a0f1c_100%)] p-6 text-white shadow-xl shadow-blue-900/10 animate-fade-up">
                <div className="absolute -right-24 -top-20 h-64 w-64 rounded-full bg-blue-300/10 blur-3xl"></div>
                <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <span className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.3em] text-white/50">Organizasyon</span>
                        <h2 className="mt-2 text-2xl sm:text-3xl font-semibold text-white">Departmanlar</h2>
                        <p className="mt-2 text-sm text-white/70 max-w-lg">
                            Departman yapılarını ve yöneticileri düzenleyin.
                        </p>
                    </div>
                    <div className="inline-flex items-center gap-2 self-start rounded-full bg-white/10 px-4 py-2 text-xs font-semibold text-white/90 backdrop-blur-md border border-white/10">
                        <i className="pi pi-sitemap text-blue-300"></i>
                        {data.length} Departman
                    </div>
                </div>
            </section>

            <CrudManager
                config={config}
                data={data}
                loading={loading}
                totalRecords={totalRecords}
                onQueryChange={onQueryChange}
                onSave={async (formData) => {
                    const payload: Partial<Department> = {
                        name: formData.name,
                        code: formData.code,
                        description: formData.description,
                        companyId: formData.companyId,
                        managerId: formData.managerId || null,
                        isActive: formData.isActive === 'true' || formData.isActive === true
                    };

                    if (formData.id) {
                        await updateDepartmentMutation.mutateAsync({ id: formData.id, ...payload });
                    } else {
                        await createDepartmentMutation.mutateAsync(payload);
                    }
                }}
                onDelete={async (item) => {
                    await deleteDepartmentMutation.mutateAsync(item.id);
                }}
            />
        </div>
    );
}

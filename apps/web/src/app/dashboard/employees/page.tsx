'use client';

import React, { useState, useMemo } from 'react';
import { Users, ShieldCheck, Sparkles } from 'lucide-react';

import { useEmployees, useCreateEmployee, useUpdateEmployee, useDeleteEmployee } from '@/hooks/queries/useEmployees';
import { EmployeeDashboardLayout } from '@/components/templates/EmployeeDashboardLayout';
import { CrudManager } from '@/components/organisms/dynamic-crud/CrudManager';
import { CrudConfig } from '@/components/organisms/dynamic-crud/types';
import { Employee } from '@/types/employees';
import { EmployeeCard } from '@/components/molecules/EmployeeCard';

interface TableState {
    page: number;
    rows: number;
    globalFilter?: string | null;
    filters?: Record<string, unknown>;
}

export default function EmployeesListPage() {
    const [query, setQuery] = useState<{
        page: number;
        limit: number;
        search?: string;
        departmentId?: string;
    }>({
        page: 1,
        limit: 10,
    });

    const { data: employeeData, isLoading } = useEmployees({
        page: query.page,
        limit: query.limit,
        search: query.search,
        departmentId: query.departmentId
    });

    const { mutateAsync: createEmployee } = useCreateEmployee();
    const { mutateAsync: updateEmployee } = useUpdateEmployee();
    const { mutateAsync: deleteEmployee } = useDeleteEmployee();

    const employees = employeeData?.data || [];

    // Quick stats for the dashboard header
    const stats = useMemo(() => {
        if (!employees.length) return { total: 0, departments: 0, activePolicies: 0 };
        return {
            total: employeeData?.total || 0,
            departments: new Set(employees.map(e => e.department?.id || e.departmentId)).size,
            activePolicies: employees.reduce((acc, curr) => acc + (curr.activePoliciesCount || 0), 0),
        };
    }, [employees, employeeData?.total]);

    const handleSave = async (formData: Employee) => {
        const mutation = formData.id ? updateEmployee : createEmployee;
        await mutation(formData);
    };

    const handleDelete = async (employee: Employee) => {
        if (confirm(`${employee.firstName} ${employee.lastName} isimli çalışanı silmek istediğinize emin misiniz?`)) {
            await deleteEmployee(employee.id);
        }
    };

    const handleQueryChange = (state: TableState) => {
        setQuery(prev => ({
            ...prev,
            page: state.page,
            limit: state.rows,
            search: state.globalFilter || undefined,
        }));
    };

    const config = useMemo<CrudConfig<Employee>>(() => ({
        title: '', // Layout handles the title
        description: '',
        endpoint: '/employees',
        viewMode: 'sidebar',
        listBehavior: 'pagination',
        primaryKey: 'id',
        table: {
            serverSide: true,
            pageSize: 10,
            globalSearch: true,
            searchPlaceholder: 'İsim veya TC No ile ara...',
            columns: [
                { field: 'fullName', header: 'Ad Soyad', sortable: true },
                { field: 'departmentName', header: 'Departman', sortable: true },
                { field: 'email', header: 'E-posta' },
                {
                    field: 'status',
                    header: 'Durum',
                    body: (row) => (
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${row.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                            }`}>
                            {row.status === 'active' ? 'Aktif' : 'Pasif'}
                        </span>
                    )
                },
            ]
        },
        cardView: {
            gridClassName: 'grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4',
            renderCard: (employee, { onEdit, onDelete }) => (
                <EmployeeCard
                    key={employee.id}
                    employee={employee}
                    onEdit={onEdit}
                    onDelete={onDelete}
                />
            )
        },
        form: {
            schema: [
                {
                    name: 'fullName',
                    label: 'Ad Soyad',
                    type: 'text',
                    validation: { required: true, min: 2 },
                    colSpan: 12,
                },
                {
                    name: 'email',
                    label: 'E-posta Adresi',
                    type: 'email',
                    validation: { required: true, email: true },
                    colSpan: 6,
                },
                {
                    name: 'tcNo',
                    label: 'TC Kimlik No',
                    type: 'text',
                    validation: { required: true, min: 11, max: 11 },
                    colSpan: 6,
                },
                {
                    name: 'departmentId',
                    label: 'Departman',
                    type: 'select',
                    serviceOptions: {
                        endpoint: '/departments',
                        labelKey: 'name',
                        valueKey: 'id'
                    },
                    validation: { required: true },
                    colSpan: 6,
                },
                {
                    name: 'status',
                    label: 'Durum',
                    type: 'select',
                    options: [
                        { label: 'Aktif', value: 'active' },
                        { label: 'Beklemede', value: 'pending' },
                        { label: 'Pasif', value: 'inactive' },
                    ],
                    defaultValue: 'active',
                    colSpan: 6,
                },
                {
                    name: 'avatarUrl',
                    label: 'Profil Fotoğrafı URL',
                    type: 'text',
                    colSpan: 12,
                    validation: { required: false }
                }
            ]
        }
    }), []);

    return (
        <EmployeeDashboardLayout
            stats={{
                totalEmployees: stats.total,
                departments: stats.departments,
                activePolicies: stats.activePolicies
            }}
            header={
                <div className="flex flex-col gap-4">
                    <div className="flex items-start justify-between">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
                                Çalışan Yönetim Merkezi
                            </h1>
                            <p className="mt-2 max-w-2xl text-lg text-teal-100/80">
                                Şirketinizdeki insan kaynakları süreçlerini, performans takibini ve özlük dosyalarını tek bir yerden güvenle yönetin.
                            </p>
                        </div>
                        <div className="hidden lg:block">
                            <div className="flex items-center gap-2 rounded-2xl bg-white/10 px-4 py-2 backdrop-blur-md border border-white/10 shadow-lg">
                                <span className="flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-emerald-400 opacity-75" />
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                                </span>
                                <span className="text-sm font-medium text-white">Sistem Aktif</span>
                            </div>
                        </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-3">
                        <div className="flex items-center gap-2 rounded-lg bg-teal-900/30 px-3 py-1.5 text-xs font-medium text-teal-100 backdrop-blur-sm border border-teal-500/20">
                            <Users className="h-3.5 w-3.5" />
                            <span>İK Yönetimi</span>
                        </div>
                        <div className="flex items-center gap-2 rounded-lg bg-blue-900/30 px-3 py-1.5 text-xs font-medium text-blue-100 backdrop-blur-sm border border-blue-500/20">
                            <ShieldCheck className="h-3.5 w-3.5" />
                            <span>Sigorta Takibi</span>
                        </div>
                        <div className="flex items-center gap-2 rounded-lg bg-indigo-900/30 px-3 py-1.5 text-xs font-medium text-indigo-100 backdrop-blur-sm border border-indigo-500/20">
                            <Sparkles className="h-3.5 w-3.5" />
                            <span>Performans</span>
                        </div>
                    </div>
                </div>
            }
        >
            <CrudManager
                config={config}
                data={employees}
                totalRecords={employeeData?.total}
                onSave={handleSave}
                onDelete={handleDelete}
                onQueryChange={handleQueryChange}
                loading={isLoading}
            />
        </EmployeeDashboardLayout>
    );
}

import React, { useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DynamicForm } from './dynamic-form/DynamicForm';
import { FieldSchema } from './dynamic-form/types';
import { Employee } from '@/types/employees';

interface EmployeeFormModalProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (data: Partial<Employee>) => Promise<void>;
    initialData?: Employee;
    loading?: boolean;
}

export const EmployeeFormModal: React.FC<EmployeeFormModalProps> = ({
    open,
    onClose,
    onSubmit,
    initialData,
    loading
}) => {
    const schema = useMemo<FieldSchema[]>(() => [
        {
            name: 'fullName',
            label: 'Ad Soyad',
            type: 'text',
            validation: { required: true, min: 2 },
            colSpan: 12, // full width (using 12-col grid logic)
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
        // We could add avatarUrl but let's keep it simple for now or adding a text input
    ], []);

    return (
        <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>{initialData ? 'Çalışan Düzenle' : 'Yeni Çalışan Ekle'}</DialogTitle>
                </DialogHeader>
                <div className="py-4">
                    <DynamicForm
                        schema={schema}
                        onSubmit={onSubmit}
                        defaultValues={initialData}
                        loading={loading}
                        submitLabel={initialData ? 'Güncelle' : 'Oluştur'}
                        gridClassName="grid grid-cols-1 md:grid-cols-12 gap-4"
                    />
                </div>
            </DialogContent>
        </Dialog>
    );
};

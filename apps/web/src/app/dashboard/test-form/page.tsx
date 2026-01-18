'use client';

import React from 'react';
import { DynamicForm } from '../../../components/organisms/dynamic-form/DynamicForm';
import { FieldSchema } from '../../../components/organisms/dynamic-form/types';

export default function TestFormPage() {
    const formSchema: FieldSchema[] = [
        {
            name: 'firstName',
            label: 'Ad',
            type: 'text',
            colSpan: 6,
            validation: { required: 'Ad zorunludur' }
        },
        {
            name: 'lastName',
            label: 'Soyad',
            type: 'text',
            colSpan: 6,
            validation: { required: 'Soyad zorunludur' }
        },
        {
            name: 'email',
            label: 'E-posta',
            type: 'email',
            colSpan: 12,
            validation: { required: 'E-posta zorunludur', pattern: { value: /^\S+@\S+$/i, message: 'Geçersiz e-posta' } }
        },
        {
            name: 'departmentId',
            label: 'Departman',
            type: 'select',
            colSpan: 6,
            serviceOptions: {
                endpoint: '/departments',
                labelKey: 'name',
                valueKey: 'id'
            }
        },
        {
            name: 'startDate',
            label: 'Başlangıç Tarihi',
            type: 'date',
            colSpan: 6
        },
        {
            name: 'bio',
            label: 'Biyografi',
            type: 'textarea',
            colSpan: 12
        },
        {
            name: 'terms',
            label: 'Koşulları kabul ediyorum',
            type: 'checkbox',
            colSpan: 12,
            validation: { required: 'Koşulları kabul etmelisiniz' }
        }
    ];

    const handleSubmit = (data: any) => {
        console.log('Form Data:', data);
        alert(JSON.stringify(data, null, 2));
    };

    return (
        <div className="flex flex-col gap-6">
            <section className="app-card rounded-[24px] p-5 sm:p-6">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                        <span className="text-xs uppercase tracking-[0.3em] text-slate-400">Form Tasarım</span>
                        <h2 className="mt-2 text-2xl font-semibold text-slate-900">Dinamik Form Deneyi</h2>
                        <p className="mt-1 text-sm text-slate-500">Örnek form akışını yeni tasarımla test edin.</p>
                    </div>
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                        Yeni çalışan
                    </span>
                </div>
            </section>

            <section className="app-card rounded-[24px] p-6 md:p-8">
                <DynamicForm
                    schema={formSchema}
                    onSubmit={handleSubmit}
                    submitLabel="Kullanıcı Oluştur"
                />
            </section>
        </div>
    );
}

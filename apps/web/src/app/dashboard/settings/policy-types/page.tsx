'use client';

import React, { useState, useEffect } from 'react';
import { CrudManager } from '../../../../components/organisms/dynamic-crud/CrudManager';
import { CrudConfig } from '../../../../components/organisms/dynamic-crud/types';
import { api } from '../../../../lib/api';
import { Badge } from '@/components/ui/badge';

export default function PolicyTypesPage() {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await api.get('/policy-types');
            setData(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const config: CrudConfig<any> = {
        title: 'Poliçe Türleri',
        description: 'Sistemde kullanılacak poliçe türlerini yönetin.',
        endpoint: '/api/policy-types',
        viewMode: 'sidebar',
        table: {
            columns: [
                {
                    field: 'name',
                    header: 'Tür Adı',
                    sortable: true,
                    body: (rowData) => (
                        <div className="flex items-center gap-2">
                            <div
                                className="w-4 h-4 rounded-full"
                                style={{ backgroundColor: rowData.color || '#cbd5e1' }}
                            />
                            <span className="font-medium text-gray-900">{rowData.name}</span>
                        </div>
                    )
                },
                { field: 'slug', header: 'Kod (Slug)', sortable: true },
                { field: 'description', header: 'Açıklama', sortable: false },
                {
                    field: 'isActive',
                    header: 'Durum',
                    sortable: true,
                    body: (rowData) => (
                        <Badge variant={rowData.isActive ? 'success' : 'secondary'}>
                            {rowData.isActive ? 'Aktif' : 'Pasif'}
                        </Badge>
                    )
                },
            ]
        },
        form: {
            schema: [
                { name: 'name', label: 'Tür Adı', type: 'text', required: true },
                { name: 'slug', label: 'Kod (Slug)', type: 'text', required: true, placeholder: 'Örn: tss' },
                { name: 'color', label: 'Renk Kodu (Hex)', type: 'text', required: false, placeholder: '#3b82f6' },
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
            <section className="relative overflow-hidden rounded-[28px] bg-[radial-gradient(120%_120%_at_10%_15%,_#8b5cf6_0%,_#0b1220_55%,_#0a0f1c_100%)] p-6 text-white shadow-xl shadow-purple-900/10 animate-fade-up">
                <div className="absolute -right-24 -top-20 h-64 w-64 rounded-full bg-purple-300/10 blur-3xl"></div>
                <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <span className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.3em] text-white/50">Ayarlar</span>
                        <h2 className="mt-2 text-2xl sm:text-3xl font-semibold text-white">Poliçe Türleri</h2>
                        <p className="mt-2 text-sm text-white/70 max-w-lg">
                            Yeni poliçe türleri oluşturun ve mevcutları düzenleyin.
                        </p>
                    </div>
                </div>
            </section>

            <CrudManager
                config={config}
                data={data}
                loading={loading}
                onSave={async (formData) => {
                    try {
                        const payload = {
                            ...formData,
                            isActive: formData.isActive === 'true' || formData.isActive === true
                        };

                        if (formData.id) {
                            await api.patch(`/policy-types/${formData.id}`, payload);
                        } else {
                            await api.post('/policy-types', payload);
                        }
                        fetchData();
                    } catch (e) {
                        console.error(e);
                    }
                }}
                onDelete={async (item) => {
                    try {
                        await api.delete(`/policy-types/${item.id}`);
                        fetchData();
                    } catch (e) {
                        console.error(e);
                    }
                }}
            />
        </div>
    );
}

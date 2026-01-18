'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { api } from '../../../../lib/api';

const statusLabels: Record<string, string> = {
    PENDING: 'Onay bekliyor',
    ACTIVE: 'Aktif',
    CANCELLED: 'Iptal',
};

const statusVariant: Record<string, 'success' | 'warning' | 'danger' | 'secondary' | 'default'> = {
    PENDING: 'warning',
    ACTIVE: 'success',
    CANCELLED: 'danger',
};

export default function CustomerCorporatePoliciesPage() {
    const router = useRouter();
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        const fetchData = async () => {
            setLoading(true);
            try {
                const res = await api.get('/corporate-policies');
                if (!cancelled) {
                    setItems(res.data || []);
                }
            } catch (error) {
                console.error(error);
            } finally {
                if (!cancelled) setLoading(false);
            }
        };
        fetchData();
        return () => {
            cancelled = true;
        };
    }, []);

    return (
        <div className="flex flex-col gap-6 pb-10">
            <section className="rounded-[28px] bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 p-6 sm:p-8 text-white shadow-2xl shadow-slate-900/40">
                <div className="flex flex-col gap-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.4em] text-emerald-200">Sozlesmelerim</p>
                    <h2 className="text-3xl font-semibold leading-tight">Kurumsal sozlesmeler</h2>
                    <p className="max-w-3xl text-sm text-white/70">
                        Onaylanan basvurularinizin sozlesme durumunu buradan takip edin.
                    </p>
                </div>
            </section>

            <section className="app-card rounded-[24px] border border-slate-100/70 p-5 sm:p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Sozlesmeler</p>
                        <h3 className="text-lg font-semibold text-slate-900">Aktif sozlesme listesi</h3>
                    </div>
                    <span className="text-xs font-semibold text-slate-500">{items.length} kayit</span>
                </div>
                <div className="mt-4 space-y-3">
                    {loading ? (
                        <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-10 text-center text-sm text-slate-400">
                            Yukleniyor...
                        </div>
                    ) : items.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
                            Sozlesme bulunmuyor.
                        </div>
                    ) : (
                        items.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => router.push(`/customer/corporate-policies/${item.id}`)}
                                className="flex w-full flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-white/80 px-4 py-4 text-left transition hover:border-slate-300"
                            >
                                <div>
                                    <p className="text-sm font-semibold text-slate-900">{item.companyName}</p>
                                    <p className="text-xs text-slate-500">{item.package?.name} • {item.carrier?.name || 'Marka yok'}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Badge variant={statusVariant[item.status] || 'secondary'}>
                                        {statusLabels[item.status] || item.status}
                                    </Badge>
                                    <span className="text-xs text-slate-400">{new Date(item.createdAt).toLocaleDateString('tr-TR')}</span>
                                </div>
                            </button>
                        ))
                    )}
                </div>
            </section>
        </div>
    );
}

'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/atoms/Button';
import { api } from '@/lib/api';

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

export default function CustomerCorporatePolicyDetailPage() {
    const router = useRouter();
    const params = useParams();
    const [item, setItem] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const id = params?.id as string;

    useEffect(() => {
        let cancelled = false;
        const fetchItem = async () => {
            setLoading(true);
            try {
                const res = await api.get(`/corporate-policies/${id}`);
                if (!cancelled) setItem(res.data);
            } catch (error) {
                console.error(error);
            } finally {
                if (!cancelled) setLoading(false);
            }
        };
        if (id) fetchItem();
        return () => {
            cancelled = true;
        };
    }, [id]);

    if (loading) {
        return <div className="p-10 text-center text-slate-500">Yukleniyor...</div>;
    }

    if (!item) {
        return <div className="p-10 text-center text-slate-500">Sozlesme bulunamadi.</div>;
    }

    return (
        <div className="flex flex-col gap-6 pb-10">
            <section className="rounded-[28px] bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 p-6 sm:p-8 text-white shadow-2xl shadow-slate-900/40">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.4em] text-emerald-200">Sozlesme detayi</p>
                        <h2 className="text-3xl font-semibold leading-tight">{item.companyName}</h2>
                        <p className="mt-2 text-sm text-white/70">{item.package?.name} • {item.carrier?.name || 'Marka yok'}</p>
                    </div>
                    <Badge variant={statusVariant[item.status] || 'secondary'}>
                        {statusLabels[item.status] || item.status}
                    </Badge>
                </div>
            </section>

            <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
                <div className="app-card rounded-[24px] border border-slate-100/70 p-5 sm:p-6 space-y-4">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Sozlesme bilgileri</p>
                        <h3 className="text-lg font-semibold text-slate-900">Paket & marka</h3>
                    </div>
                    <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                        <p className="text-xs text-slate-500">Paket</p>
                        <p className="text-sm font-semibold text-slate-900">{item.package?.name}</p>
                        <p className="text-xs text-slate-500">{item.package?.priceRange}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                        <p className="text-xs text-slate-500">Marka</p>
                        <p className="text-sm font-semibold text-slate-900">{item.carrier?.name || '-'}</p>
                        <p className="text-xs text-slate-500">{item.carrier?.code || ''}</p>
                    </div>
                    {item.policyType && (
                        <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                            <p className="text-xs text-slate-500">Poliçe tipi</p>
                            <p className="text-sm font-semibold text-slate-900">{item.policyType}</p>
                        </div>
                    )}
                </div>

                <div className="app-card rounded-[24px] border border-slate-100/70 p-5 sm:p-6 space-y-4">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Tarih</p>
                        <h3 className="text-lg font-semibold text-slate-900">Sozlesme donemi</h3>
                    </div>
                    <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                        <p className="text-xs text-slate-500">Baslangic</p>
                        <p className="text-sm font-semibold text-slate-900">
                            {item.startDate ? new Date(item.startDate).toLocaleDateString('tr-TR') : '-'}
                        </p>
                    </div>
                    <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                        <p className="text-xs text-slate-500">Bitis</p>
                        <p className="text-sm font-semibold text-slate-900">
                            {item.endDate ? new Date(item.endDate).toLocaleDateString('tr-TR') : '-'}
                        </p>
                    </div>
                    <Button variant="outline" onClick={() => router.push('/customer/corporate-policies')}>Listeye don</Button>
                </div>
            </section>
        </div>
    );
}

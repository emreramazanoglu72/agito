'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '../../../../../components/atoms/Button';
import { api } from '../../../../../lib/api';

const statusMap: Record<string, { label: string; variant: 'success' | 'warning' | 'danger' | 'secondary' | 'default' }> = {
    ACTIVE: { label: 'Aktif', variant: 'success' },
    PENDING_RENEWAL: { label: 'Yenileme Bekliyor', variant: 'warning' },
    CANCELLED: { label: 'Iptal', variant: 'danger' },
    EXPIRED: { label: 'Suresi Doldu', variant: 'secondary' },
};

export default function CustomerPolicyDetailPage() {
    const router = useRouter();
    const params = useParams();
    const policyId = params?.id as string;
    const [policy, setPolicy] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        const fetchPolicy = async () => {
            setLoading(true);
            try {
                const res = await api.get(`/policies/${policyId}`);
                if (!cancelled) {
                    setPolicy(res.data);
                }
            } catch (error) {
                console.error(error);
            } finally {
                if (!cancelled) setLoading(false);
            }
        };
        if (policyId) {
            fetchPolicy();
        }
        return () => {
            cancelled = true;
        };
    }, [policyId]);

    const currencyFormatter = useMemo(() => new Intl.NumberFormat('tr-TR', {
        style: 'currency',
        currency: 'TRY',
        maximumFractionDigits: 0,
    }), []);

    if (loading) {
        return (
            <div className="rounded-3xl border border-slate-100 bg-slate-50 px-6 py-10 text-center text-sm text-slate-400">
                Yukleniyor...
            </div>
        );
    }

    if (!policy) {
        return (
            <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center text-sm text-slate-500">
                Police bulunamadi.
            </div>
        );
    }

    const statusInfo = statusMap[policy.status] || { label: policy.status, variant: 'secondary' };

    return (
        <div className="flex flex-col gap-6 pb-10">
            <section className="rounded-[28px] bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 p-6 sm:p-8 text-white shadow-2xl shadow-slate-900/40">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.4em] text-emerald-200">Police detayi</p>
                        <h2 className="text-3xl font-semibold leading-tight">{policy.policyNo}</h2>
                        <p className="mt-2 text-sm text-white/70">{policy.company?.name || 'Kurumsal police'}</p>
                    </div>
                    <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                </div>
            </section>

            <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
                <div className="app-card rounded-[24px] border border-slate-100/70 p-5 sm:p-6 space-y-4">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Genel bilgiler</p>
                        <h3 className="text-lg font-semibold text-slate-900">Police ozeti</h3>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                        <div className="rounded-2xl border border-slate-100 bg-white px-4 py-3">
                            <p className="text-xs text-slate-500">Calisan</p>
                            <p className="text-sm font-semibold text-slate-900">{policy.employee?.firstName} {policy.employee?.lastName}</p>
                        </div>
                        <div className="rounded-2xl border border-slate-100 bg-white px-4 py-3">
                            <p className="text-xs text-slate-500">Police tipi</p>
                            <p className="text-sm font-semibold text-slate-900">{policy.type}</p>
                        </div>
                        <div className="rounded-2xl border border-slate-100 bg-white px-4 py-3">
                            <p className="text-xs text-slate-500">Baslangic</p>
                            <p className="text-sm font-semibold text-slate-900">{new Date(policy.startDate).toLocaleDateString('tr-TR')}</p>
                        </div>
                        <div className="rounded-2xl border border-slate-100 bg-white px-4 py-3">
                            <p className="text-xs text-slate-500">Bitis</p>
                            <p className="text-sm font-semibold text-slate-900">{new Date(policy.endDate).toLocaleDateString('tr-TR')}</p>
                        </div>
                        <div className="rounded-2xl border border-slate-100 bg-white px-4 py-3">
                            <p className="text-xs text-slate-500">Prim</p>
                            <p className="text-sm font-semibold text-slate-900">{currencyFormatter.format(Number(policy.premium || 0))}</p>
                        </div>
                    </div>
                </div>

                <div className="app-card rounded-[24px] border border-slate-100/70 p-5 sm:p-6 space-y-4">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Teminatlar</p>
                        <h3 className="text-lg font-semibold text-slate-900">Policede yer alan teminatlar</h3>
                    </div>
                    {policy.coverages?.length ? (
                        <div className="space-y-3">
                            {policy.coverages.map((coverage: any) => (
                                <div key={coverage.id} className="rounded-2xl border border-slate-100 bg-white px-4 py-3">
                                    <p className="text-sm font-semibold text-slate-900">{coverage.name}</p>
                                    <p className="text-xs text-slate-500">Limit: {coverage.limit}</p>
                                    {coverage.description && (
                                        <p className="mt-1 text-xs text-slate-500">{coverage.description}</p>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-xs text-slate-500">
                            Teminat bilgisi bulunmuyor.
                        </div>
                    )}
                </div>
            </section>

            <section className="app-card rounded-[24px] border border-slate-100/70 p-5 sm:p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Odeme takvimi</p>
                        <h3 className="text-lg font-semibold text-slate-900">Taksitler</h3>
                    </div>
                    <Button variant="outline" onClick={() => router.push('/customer/payments')}>Tum odemeler</Button>
                </div>
                <div className="mt-4 space-y-3">
                    {policy.payments?.length ? (
                        policy.payments.map((payment: any) => (
                            <div key={payment.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-white/80 px-4 py-3">
                                <div>
                                    <p className="text-sm font-semibold text-slate-900">Taksit #{payment.installmentNo}</p>
                                    <p className="text-xs text-slate-500">{new Date(payment.dueDate).toLocaleDateString('tr-TR')}</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-sm font-semibold text-slate-900">{currencyFormatter.format(Number(payment.amount || 0))}</span>
                                    <Badge variant={payment.status === 'PAID' ? 'success' : payment.status === 'OVERDUE' ? 'danger' : 'warning'}>
                                        {payment.status}
                                    </Badge>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-xs text-slate-500">
                            Odeme takvimi bulunmuyor.
                        </div>
                    )}
                </div>
            </section>

            <section className="app-card rounded-[24px] border border-slate-100/70 p-5 sm:p-6">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Dokumanlar</p>
                    <h3 className="text-lg font-semibold text-slate-900">Police dosyalari</h3>
                </div>
                <div className="mt-4 space-y-3">
                    {policy.documents?.length ? (
                        policy.documents.map((doc: any) => (
                            <a
                                key={doc.id}
                                href={doc.url}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white/80 px-4 py-3 text-sm font-semibold text-slate-700 hover:border-slate-300"
                            >
                                <span>{doc.name}</span>
                                <span className="text-xs text-slate-400">Indir</span>
                            </a>
                        ))
                    ) : (
                        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-xs text-slate-500">
                            Dokuman bulunmuyor.
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}

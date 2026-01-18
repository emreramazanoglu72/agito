'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '../../../../components/atoms/Input';
import { Button } from '../../../../components/atoms/Button';
import { Badge } from '@/components/ui/badge';
import { api } from '../../../../lib/api';
import { useDebounce } from '../../../../hooks/useDebounce';

const statusMap: Record<string, { label: string; variant: 'success' | 'warning' | 'danger' | 'secondary' | 'default' }> = {
    ACTIVE: { label: 'Aktif', variant: 'success' },
    PENDING_RENEWAL: { label: 'Yenileme Bekliyor', variant: 'warning' },
    CANCELLED: { label: 'Iptal', variant: 'danger' },
    EXPIRED: { label: 'Suresi Doldu', variant: 'secondary' },
};

export default function CustomerPoliciesPage() {
    const router = useRouter();
    const [policies, setPolicies] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState('');
    const pageSize = 8;

    const debouncedSearch = useDebounce(search, 400);

    useEffect(() => {
        let cancelled = false;
        const fetchPolicies = async () => {
            setLoading(true);
            try {
                const res = await api.get('/policies', {
                    params: {
                        page,
                        limit: pageSize,
                        search: debouncedSearch || undefined,
                        status: status || undefined,
                    },
                });
                if (!cancelled) {
                    setPolicies(res.data?.data ?? []);
                    setTotal(res.data?.total ?? 0);
                }
            } catch (error) {
                console.error(error);
            } finally {
                if (!cancelled) setLoading(false);
            }
        };
        fetchPolicies();
        return () => {
            cancelled = true;
        };
    }, [page, pageSize, debouncedSearch, status]);

    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    const currencyFormatter = useMemo(() => new Intl.NumberFormat('tr-TR', {
        style: 'currency',
        currency: 'TRY',
        maximumFractionDigits: 0,
    }), []);

    return (
        <div className="flex flex-col gap-6 pb-10">
            <section className="rounded-[28px] bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 p-6 sm:p-8 text-white shadow-2xl shadow-slate-900/40">
                <div className="flex flex-col gap-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.4em] text-emerald-200">Policeler</p>
                    <h2 className="text-3xl font-semibold leading-tight">Kurumsal police listesi</h2>
                    <p className="max-w-3xl text-sm text-white/70">
                        Aktif policelerinizi, yenileme ve iptal durumlarini bu ekranda izleyin.
                    </p>
                </div>
            </section>

            <section className="app-card rounded-[24px] border border-slate-100/70 p-5 sm:p-6">
                <div className="flex flex-wrap items-center gap-3">
                    <div className="min-w-[220px] flex-1">
                        <Input
                            id="policy-search"
                            label="Arama"
                            placeholder="Police no veya calisan ara"
                            value={search}
                            onChange={(event) => {
                                setSearch(event.target.value);
                                setPage(1);
                            }}
                        />
                    </div>
                    <div className="min-w-[200px]">
                        <label className="text-sm font-medium text-slate-700">Durum</label>
                        <select
                            value={status}
                            onChange={(event) => {
                                setStatus(event.target.value);
                                setPage(1);
                            }}
                            className="mt-2 h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                        >
                            <option value="">Tum durumlar</option>
                            <option value="ACTIVE">Aktif</option>
                            <option value="PENDING_RENEWAL">Yenileme bekliyor</option>
                            <option value="EXPIRED">Suresi doldu</option>
                            <option value="CANCELLED">Iptal</option>
                        </select>
                    </div>
                </div>

                <div className="mt-6 space-y-3">
                    {loading ? (
                        <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-10 text-center text-sm text-slate-400">
                            Yukleniyor...
                        </div>
                    ) : policies.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
                            Polisi kaydi bulunmuyor.
                        </div>
                    ) : (
                        policies.map((policy) => {
                            const statusInfo = statusMap[policy.status] || { label: policy.status, variant: 'secondary' };
                            return (
                                <button
                                    key={policy.id}
                                    onClick={() => router.push(`/customer/policies/${policy.id}`)}
                                    className="flex w-full flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-white/80 px-4 py-4 text-left transition hover:border-slate-300"
                                >
                                    <div>
                                        <p className="text-sm font-semibold text-slate-900">{policy.policyNo}</p>
                                        <p className="text-xs text-slate-500">
                                            {policy.employee?.firstName} {policy.employee?.lastName} • {policy.type}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="text-right">
                                            <p className="text-sm font-semibold text-slate-900">{currencyFormatter.format(Number(policy.premium || 0))}</p>
                                            <p className="text-[11px] text-slate-400">
                                                {new Date(policy.startDate).toLocaleDateString('tr-TR')} - {new Date(policy.endDate).toLocaleDateString('tr-TR')}
                                            </p>
                                        </div>
                                        <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                                    </div>
                                </button>
                            );
                        })
                    )}
                </div>

                <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500">
                    <span>{total} kayit</span>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" onClick={() => setPage((prev) => Math.max(1, prev - 1))} disabled={page <= 1}>
                            Geri
                        </Button>
                        <span>{page} / {totalPages}</span>
                        <Button variant="outline" onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))} disabled={page >= totalPages}>
                            Ileri
                        </Button>
                    </div>
                </div>
            </section>
        </div>
    );
}

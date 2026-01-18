'use client';

import { useEffect, useMemo, useState } from 'react';
import { Input } from '../../../../components/atoms/Input';
import { Button } from '../../../../components/atoms/Button';
import { Badge } from '@/components/ui/badge';
import { api } from '../../../../lib/api';
import { useDebounce } from '../../../../hooks/useDebounce';

const statusVariant: Record<string, 'success' | 'warning' | 'danger' | 'secondary' | 'default'> = {
    PAID: 'success',
    PENDING: 'warning',
    OVERDUE: 'danger',
};

export default function CustomerPaymentsPage() {
    const [payments, setPayments] = useState<any[]>([]);
    const [summary, setSummary] = useState({ total: 0, collected: 0, pending: 0, overdue: 0 });
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState('');
    const pageSize = 8;

    const debouncedSearch = useDebounce(search, 400);

    useEffect(() => {
        let cancelled = false;
        const fetchPayments = async () => {
            setLoading(true);
            try {
                const res = await api.get('/payments', {
                    params: {
                        page,
                        limit: pageSize,
                        search: debouncedSearch || undefined,
                        status: status || undefined,
                    },
                });
                if (!cancelled) {
                    setPayments(res.data?.data ?? []);
                    setSummary(res.data?.summary ?? { total: 0, collected: 0, pending: 0, overdue: 0 });
                    setTotal(res.data?.meta?.total ?? 0);
                }
            } catch (error) {
                console.error(error);
            } finally {
                if (!cancelled) setLoading(false);
            }
        };
        fetchPayments();
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
                    <p className="text-xs font-semibold uppercase tracking-[0.4em] text-emerald-200">Finans</p>
                    <h2 className="text-3xl font-semibold leading-tight">Police odeme takibi</h2>
                    <p className="max-w-3xl text-sm text-white/70">
                        Tahsilat planinizi ve gecikmeleri tek ekranda izleyin.
                    </p>
                </div>
                <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3">
                        <p className="text-xs text-white/60">Toplam prim</p>
                        <p className="mt-2 text-lg font-semibold text-white">{currencyFormatter.format(Number(summary.total || 0))}</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3">
                        <p className="text-xs text-white/60">Tahsil edilen</p>
                        <p className="mt-2 text-lg font-semibold text-white">{currencyFormatter.format(Number(summary.collected || 0))}</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3">
                        <p className="text-xs text-white/60">Bekleyen</p>
                        <p className="mt-2 text-lg font-semibold text-white">{currencyFormatter.format(Number(summary.pending || 0))}</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3">
                        <p className="text-xs text-white/60">Geciken</p>
                        <p className="mt-2 text-lg font-semibold text-white">{currencyFormatter.format(Number(summary.overdue || 0))}</p>
                    </div>
                </div>
            </section>

            <section className="app-card rounded-[24px] border border-slate-100/70 p-5 sm:p-6">
                <div className="flex flex-wrap items-center gap-3">
                    <div className="min-w-[220px] flex-1">
                        <Input
                            id="payment-search"
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
                            <option value="PAID">Odendi</option>
                            <option value="PENDING">Bekliyor</option>
                            <option value="OVERDUE">Gecikmis</option>
                        </select>
                    </div>
                </div>

                <div className="mt-6 space-y-3">
                    {loading ? (
                        <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-10 text-center text-sm text-slate-400">
                            Yukleniyor...
                        </div>
                    ) : payments.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
                            Odeme kaydi bulunmuyor.
                        </div>
                    ) : (
                        payments.map((payment) => (
                            <div key={payment.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-white/80 px-4 py-4">
                                <div>
                                    <p className="text-sm font-semibold text-slate-900">{payment.policy?.policyNo}</p>
                                    <p className="text-xs text-slate-500">
                                        {payment.policy?.employee?.firstName} {payment.policy?.employee?.lastName} • {new Date(payment.dueDate).toLocaleDateString('tr-TR')}
                                    </p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-sm font-semibold text-slate-900">{currencyFormatter.format(Number(payment.amount || 0))}</span>
                                    <Badge variant={statusVariant[payment.status] || 'secondary'}>{payment.status}</Badge>
                                </div>
                            </div>
                        ))
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

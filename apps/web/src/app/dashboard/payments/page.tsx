'use client';

import { Badge } from '@/components/ui/badge';
import { useDebounce } from '@/hooks/useDebounce';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { usePayments } from '@/hooks/queries/usePayments';

export default function PaymentsPage() {
    const router = useRouter();
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [page, setPage] = useState(1);
    const debouncedSearch = useDebounce(search, 500);

    const { data: paymentData, isLoading } = usePayments({
        page,
        limit: 10,
        search: debouncedSearch,
        status: statusFilter || undefined,
    });

    const data = paymentData?.data || [];
    const stats = paymentData?.summary || { total: 0, collected: 0, pending: 0, overdue: 0 };
    const totalPages = paymentData?.meta?.lastPage || 1;
    const loading = isLoading;

    // Remove legacy fetchData and useEffect


    const currencyFormatter = new Intl.NumberFormat('tr-TR', {
        style: 'currency',
        currency: 'TRY',
    });
    const completionRate = stats.total ? Math.min(100, Math.round((stats.collected / stats.total) * 100)) : 0;
    const overdueRate = stats.total ? Math.min(100, Math.round((stats.overdue / stats.total) * 100)) : 0;
    const now = useMemo(() => Date.now(), []);

    const statusSummary = useMemo(() => {
        const baseRecord: Record<string, number> = { PAID: 0, PENDING: 0, OVERDUE: 0 };
        data.forEach((item: any) => {
            baseRecord[item.status] = (baseRecord[item.status] || 0) + 1;
        });
        return baseRecord;
    }, [data]);

    const upcomingPayments = useMemo(() => {
        const soonWindow = 7 * 24 * 60 * 60 * 1000; // 7 days
        return data
            .filter((item: any) => {
                const due = new Date(item.dueDate).getTime();
                return due >= now && due <= now + soonWindow;
            })
            .sort((a: any, b: any) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
            .slice(0, 3);
    }, [data, now]);

    const overduePayments = useMemo(() => {
        return data
            .filter((item: any) => item.status === 'OVERDUE')
            .sort((a: any, b: any) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime())
            .slice(0, 2);
    }, [data]);

    const StatCard = ({ title, value, icon, accent, subValue }: any) => (
        <div className="flex flex-col justify-between gap-3 rounded-[24px] border border-slate-100/70 bg-white/80 p-6 shadow shadow-slate-900/5">
            <div className="flex items-start justify-between">
                <div>
                    <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">{title}</span>
                    <h3 className="mt-2 text-2xl font-bold text-slate-900">{value}</h3>
                </div>
                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${accent}`}>
                    <i className={`pi ${icon} text-lg text-white`}></i>
                </div>
            </div>
            {subValue && <span className="text-xs font-medium text-slate-500">{subValue}</span>}
        </div>
    );

    const statusLabels: Record<string, string> = {
        PAID: 'Ödendi',
        PENDING: 'Bekliyor',
        OVERDUE: 'Gecikmiş'
    };

    return (
        <div className="flex flex-col gap-6 animate-fade-in">
            <section className="rounded-[28px] bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 p-6 text-white shadow-2xl shadow-slate-900/40">
                <div className="flex flex-col gap-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.4em] text-emerald-200">Finans Merkezi</p>
                    <h2 className="text-3xl font-semibold leading-tight">Ödeme akışı ve tahsilat performansı</h2>
                    <p className="max-w-3xl text-sm text-white/70">
                        Tahsilat hedefine doğru ilerlerken gecikmeleri yakından takip edin, öncelikli operasyonları belirleyin
                        ve nakit akışının durumunu tüm ekip için paylaşılabilir bir panoda tutun.
                    </p>
                </div>
                <div className="mt-6 grid gap-4 md:grid-cols-[1.4fr_1fr]">
                    <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/60">Tahsilat oranı</p>
                                <p className="mt-2 text-3xl font-semibold">{completionRate}%</p>
                            </div>
                            <div className="flex flex-col items-end">
                                <span className="text-xs text-white/70">Tahsil Edilen / Planlanan</span>
                                <span className="text-[13px] font-semibold text-white">{stats.collected ? `${currencyFormatter.format(stats.collected)} / ${currencyFormatter.format(stats.total || 1)}` : '-'}</span>
                            </div>
                        </div>
                        <div className="mt-4 h-2 rounded-full bg-white/10">
                            <div className="h-2 rounded-full bg-emerald-400 transition-all" style={{ width: `${completionRate}%` }}></div>
                        </div>
                        <p className="mt-3 text-xs text-white/60">
                            {overdueRate}% oranı, mevcut portföyde gecikmeye düşmüş bakiyeleri temsil ediyor.
                        </p>
                    </div>
                    <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
                        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/60">Kritik Göstergeler</p>
                        <div className="mt-4 space-y-3">
                            <div className="flex items-center justify-between text-sm text-white/80">
                                <span>Tahsilat hızı</span>
                                <span className="font-semibold text-white">{statusSummary.PAID ?? 0} / {data.length}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm text-white/80">
                                <span>Gecikme sayısı</span>
                                <span className="font-semibold text-white">{statusSummary.OVERDUE ?? 0}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm text-white/80">
                                <span>Bekleyen taksitler</span>
                                <span className="font-semibold text-white">{statusSummary.PENDING ?? 0}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="grid gap-4 lg:grid-cols-3">
                <StatCard
                    title="Toplam Beklenen"
                    value={currencyFormatter.format(stats.total)}
                    icon="pi-wallet"
                    accent="bg-blue-500"
                    subValue="Tüm dönemler"
                />
                <StatCard
                    title="Tahsil Edilen"
                    value={currencyFormatter.format(stats.collected)}
                    icon="pi-check-circle"
                    accent="bg-emerald-500"
                    subValue={`${completionRate}% tamamlandı`}
                />
                <StatCard
                    title="Gecikmiş"
                    value={currencyFormatter.format(stats.overdue)}
                    icon="pi-exclamation-circle"
                    accent="bg-rose-500"
                    subValue="Hemen aksiyon"
                />
            </section>

            <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
                <div className="space-y-4 rounded-[24px] border border-slate-100 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-semibold text-slate-900">Bu hafta ödemeye çıkanlar</h3>
                            <p className="text-xs text-slate-500">7 gün içinde vadesi gelen taksitler</p>
                        </div>
                        <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">{upcomingPayments.length} kayıt</span>
                    </div>
                    <div className="space-y-3">
                        {upcomingPayments.length === 0 ? (
                            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                                Bu hafta için planlanmış tahsilat bulunmuyor.
                            </div>
                        ) : (
                            upcomingPayments.map((item: any) => (
                                <div key={item.id} className="flex items-center justify-between rounded-2xl border border-slate-100 px-4 py-3 text-sm">
                                    <div>
                                        <div className="text-slate-900 font-semibold">{item.policy?.policyNo}</div>
                                        <div className="text-xs text-slate-500">
                                            {format(new Date(item.dueDate), 'd MMM yyyy', { locale: tr })} — {item.policy?.employee?.firstName} {item.policy?.employee?.lastName}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-semibold text-slate-900">{currencyFormatter.format(item.amount)}</p>
                                        <Badge variant={item.status === 'PAID' ? 'success' : item.status === 'OVERDUE' ? 'danger' : 'warning'}>
                                            {statusLabels[item.status] ?? item.status}
                                        </Badge>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
                <div className="space-y-4 rounded-[24px] border border-slate-100 bg-white/90 p-5 shadow-sm">
                    <div>
                        <h3 className="text-lg font-semibold text-slate-900">Durum dağılımı</h3>
                        <p className="text-xs text-slate-500">Anlık taksit kategorileri</p>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                        {Object.entries(statusSummary).map(([status, count]) => (
                            <div key={status} className="rounded-2xl border border-slate-100/70 bg-slate-50 px-3 py-3 text-center text-xs font-semibold text-slate-600">
                                <div>{statusLabels[status] ?? status}</div>
                                <div className="mt-1 text-2xl text-slate-900">{count}</div>
                            </div>
                        ))}
                    </div>
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                        Overdue: {statusSummary.OVERDUE ?? 0} | Bekleyen: {statusSummary.PENDING ?? 0} | Ödendi: {statusSummary.PAID ?? 0}
                    </div>
                    <div className="space-y-3">
                        <div className="text-xs uppercase tracking-[0.3em] text-slate-400">Acil müdahale</div>
                        {overduePayments.length === 0 ? (
                            <p className="text-sm text-slate-500">Gecikme riski şu an kontrol altında.</p>
                        ) : (
                            overduePayments.map((item: any) => (
                                <div key={item.id} className="flex items-center justify-between rounded-xl border border-rose-100 bg-rose-50/60 px-3 py-2 text-xs text-rose-600">
                                    <span className="font-semibold">{item.policy?.policyNo}</span>
                                    <span>{currencyFormatter.format(item.amount)}</span>
                                    <span>{format(new Date(item.dueDate), 'dd MMM')}</span>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </section>

            <section className="rounded-[26px] border border-slate-100 bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-4 border-b border-slate-100 pb-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h3 className="text-lg font-semibold text-slate-900">Tahsilat tablo görünümü</h3>
                        <p className="text-xs text-slate-500">Filtrele, ara ve sayfala</p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <div className="relative w-full md:w-72">
                            <i className="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></i>
                            <input
                                type="text"
                                placeholder="Poliçe no, isim, soyisim..."
                                className="h-10 w-full rounded-xl border border-slate-200 pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-2">
                            {['', 'PENDING', 'PAID', 'OVERDUE'].map((s) => (
                                <button
                                    key={s}
                                    onClick={() => { setStatusFilter(s); setPage(1); }}
                                    className={`rounded-xl px-3 py-2 text-xs font-semibold transition ${statusFilter === s
                                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                                        }`}
                                >
                                    {s === '' ? 'Durum' : s === 'PENDING' ? 'Bekleyen' : s === 'PAID' ? 'Ödenen' : 'Gecikmiş'}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="mt-4 overflow-x-auto">
                    <table className="min-w-full text-left text-sm text-slate-600">
                        <thead className="border-b border-slate-100 text-xs uppercase text-slate-400">
                            <tr>
                                <th className="px-4 py-3">Poliçe</th>
                                <th className="px-4 py-3">Çalışan</th>
                                <th className="px-4 py-3">Tutar</th>
                                <th className="px-4 py-3">Vade</th>
                                <th className="px-4 py-3 text-center">Durum</th>
                                <th className="px-4 py-3 text-right">İşlem</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-4 py-8 text-center text-xs text-slate-400">
                                        Yükleniyor...
                                    </td>
                                </tr>
                            ) : data.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-4 py-8 text-center text-xs text-slate-400">
                                        Kayıt bulunamadı.
                                    </td>
                                </tr>
                            ) : (
                                data.map((item: any) => (
                                    <tr key={item.id} className="group hover:bg-slate-50 transition-colors">
                                        <td className="px-4 py-4 cursor-pointer" onClick={() => router.push(`/dashboard/policies/${item.policy?.id}`)}>
                                            <div className="text-slate-900 font-bold hover:text-blue-600 transition-colors decoration-slice flex items-center gap-1">
                                                {item.policy?.policyNo}
                                                <i className="pi pi-external-link text-[10px] text-slate-400 opacity-0 group-hover:opacity-100"></i>
                                            </div>
                                            <div className="text-[11px] text-slate-400">{item.installmentNo}. Taksit</div>
                                        </td>
                                        <td className="px-4 py-4 cursor-pointer" onClick={() => router.push(`/dashboard/employees/${item.policy?.employeeId || item.policy?.employee?.id}`)}>
                                            <div className="flex items-center gap-2">
                                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600 border border-slate-200">
                                                    {(item.policy?.employee?.firstName?.[0] ?? '') + (item.policy?.employee?.lastName?.[0] ?? '')}
                                                </div>
                                                <div className="group/emp">
                                                    <p className="text-xs font-bold text-slate-900 group-hover/emp:text-blue-600 transition-colors">
                                                        {item.policy?.employee?.firstName} {item.policy?.employee?.lastName}
                                                    </p>
                                                    <p className="text-[10px] text-slate-400">
                                                        {item.policy?.company?.name ?? 'Şirket bilgisi yok'}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 font-bold text-slate-700 font-mono">
                                            {currencyFormatter.format(item.amount)}
                                        </td>
                                        <td className="px-4 py-4 text-slate-500 font-medium text-xs">
                                            {format(new Date(item.dueDate), 'd MMM yyyy', { locale: tr })}
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            <Badge variant={item.status === 'PAID' ? 'success' : item.status === 'OVERDUE' ? 'danger' : 'warning'}>
                                                {statusLabels[item.status] ?? item.status}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-4 text-right">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    // Handle send reminder or other action
                                                }}
                                                className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                                            >
                                                <i className="pi pi-ellipsis-h"></i>
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-6">
                    <span className="text-xs font-medium text-slate-500">
                        Toplam {stats.totalCount || data.length} kayıttan {(page - 1) * 10 + 1}-{Math.min(page * 10, stats.totalCount || 999)} arası gösteriliyor
                    </span>
                    <div className="flex items-center gap-2">
                        <button
                            disabled={page === 1}
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-sm transition-all hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <i className="pi pi-chevron-left text-xs"></i>
                        </button>
                        <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1">
                            <span className="text-xs font-bold text-slate-700">{page}</span>
                            <span className="text-[10px] text-slate-400">/ {totalPages}</span>
                        </div>
                        <button
                            disabled={page === totalPages}
                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-sm transition-all hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <i className="pi pi-chevron-right text-xs"></i>
                        </button>
                    </div>
                </div>
            </section>
        </div>
    );
}

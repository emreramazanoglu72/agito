'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Tooltip, Legend, Filler } from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';
import { useAdminDashboardStats, useRecentActivities } from '@/hooks/queries/useDashboard';
import { useUser } from '@/hooks/queries/useAuth';

interface Stats {
    totalPolicies: number;
    totalCompanies: number;
    totalEmployees: number;
    activePolicies: number;
    pendingRenewals: number;
    renewedThisMonth: number;
    totalPremium: number;
}

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Tooltip, Legend, Filler);

type ChartRangeKey = '6m' | '12m';
type UserRole = 'ADMIN' | 'HR_MANAGER' | 'EMPLOYEE';

interface DashboardAnalytics {
    stats: Stats;
    changes: {
        renewedThisMonth: { value: string; tone: 'positive' | 'negative' | 'neutral' };
        totalPremium: { value: string; tone: 'positive' | 'negative' | 'neutral' };
    };
    operations: {
        slaTarget: number;
        avgProcessingHours: number;
        successRate: number;
        backlog: number;
    };
    chart: {
        labels: string[];
        datasets: Array<{
            label: string;
            data: number[];
            fill: boolean;
            borderColor: string;
            backgroundColor: string;
            tension: number;
        }>;
    };
    doughnut: {
        labels: string[];
        datasets: Array<{
            data: number[];
            backgroundColor: string[];
            hoverBackgroundColor: string[];
            borderWidth: number;
        }>;
    };
}

export default function DashboardPage() {
    const router = useRouter();
    const [chartRange, setChartRange] = useState<ChartRangeKey>('6m');

    const { data: user } = useUser();
    const userRole = user?.role || 'EMPLOYEE';

    const { data: analytics, isLoading: analyticsLoading } = useAdminDashboardStats(chartRange);
    const { data: activities, isLoading: activitiesLoading } = useRecentActivities(5);

    const loading = analyticsLoading || activitiesLoading;
    const chartLoading = analyticsLoading;

    // Derived State
    const stats = analytics?.stats || {
        totalPolicies: 0,
        totalCompanies: 0,
        totalEmployees: 0,
        activePolicies: 0,
        pendingRenewals: 0,
        renewedThisMonth: 0,
        totalPremium: 0
    };

    const operations = analytics?.operations || {
        slaTarget: 95,
        avgProcessingHours: 0,
        successRate: 0,
        backlog: 0
    };



    const chartData = analytics?.chart || { labels: [], datasets: [] };
    const doughnutData = analytics?.doughnut || {
        labels: ['TSS', 'OSS', 'LIFE', 'Ferdi Kaza'],
        datasets: [{ data: [0, 0, 0, 0], backgroundColor: ['#0ea5a4', '#38bdf8', '#f59e0b', '#f97316'], borderWidth: 0 }]
    };

    const activityItems = activities || [];

    const [hasLoaded, setHasLoaded] = useState(false);

    const formatCompact = (value: number) =>
        new Intl.NumberFormat('tr-TR', { notation: 'compact', maximumFractionDigits: 1 }).format(value);

    const formatNumber = (value: number) =>
        new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 }).format(value);

    const formatCompactCurrency = (value: number) => `₺${formatCompact(value)}`;

    const resolveRole = () => {
        if (typeof window === 'undefined') return 'EMPLOYEE' as const;
        return 'EMPLOYEE' as const;
    };

    const statChanges = {
        renewedThisMonth: analytics?.changes?.renewedThisMonth || { value: '0%', tone: 'neutral' },
        totalPremium: analytics?.changes?.totalPremium || { value: '0%', tone: 'neutral' },
        activePolicies: { value: '0%', tone: 'neutral' },
        pendingRenewals: { value: '0%', tone: 'neutral' }
    } as const;

    const chartOptions = {
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom' as const,
                labels: {
                    usePointStyle: true,
                    padding: 20
                }
            }
        },
        scales: {
            x: { grid: { display: false }, ticks: { color: 'rgb(100 116 139)' } },
            y: { grid: { color: 'rgba(15,23,42,0.06)' }, ticks: { color: 'rgb(100 116 139)' }, beginAtZero: true }
        }
    };

    const doughnutOptions = {
        cutout: '70%',
        plugins: {
            legend: {
                position: 'bottom' as const,
                labels: { usePointStyle: true, padding: 15, font: { size: 11 } }
            }
        }
    };

    const kpiCards = [
        { title: 'Toplam Poliçe', value: formatNumber(stats.totalPolicies), helper: 'Portföy büyüklüğü' },
        { title: 'Aktif Şirket', value: formatNumber(stats.totalCompanies), helper: 'Sözleşmeli müşteri' },
        { title: 'Toplam Çalışan', value: formatNumber(stats.totalEmployees), helper: 'Sigortalı sayısı' },
        { title: 'Aktif Poliçe', value: formatNumber(stats.activePolicies), helper: 'Canlı poliçeler' }
    ];

    const quickActions = [
        { label: 'Yeni Poliçe', desc: 'Yeni poliçe oluştur', icon: 'pi pi-plus', href: '/dashboard/policies', roles: ['ADMIN', 'HR_MANAGER'] },
        { label: 'Toplu Yükleme', desc: 'Excel/CSV aktar', icon: 'pi pi-upload', href: '/dashboard/operations', roles: ['ADMIN', 'HR_MANAGER'] },
        { label: 'Şirket Ekle', desc: 'Kurumsal müşteri', icon: 'pi pi-building', href: '/dashboard/companies', roles: ['ADMIN'] },
        { label: 'Raporlar', desc: 'Analiz ve raporlar', icon: 'pi pi-chart-bar', href: '/dashboard', roles: ['ADMIN', 'HR_MANAGER', 'EMPLOYEE'] }
    ];



    const getActivityIcon = (type: string) => {
        switch (type) {
            case 'COMPANY_CREATED': return { icon: 'pi pi-building', color: 'text-sky-600', bg: 'bg-sky-100' };
            case 'EMPLOYEE_CREATED': return { icon: 'pi pi-user-plus', color: 'text-teal-600', bg: 'bg-teal-100' };
            case 'POLICY_CREATED': return { icon: 'pi pi-check-circle', color: 'text-emerald-600', bg: 'bg-emerald-100' };
            case 'COMPANY_UPDATED':
            case 'EMPLOYEE_UPDATED':
            case 'POLICY_UPDATED': return { icon: 'pi pi-pencil', color: 'text-amber-600', bg: 'bg-amber-100' };
            case 'COMPANY_DELETED':
            case 'EMPLOYEE_DELETED':
            case 'POLICY_DELETED': return { icon: 'pi pi-trash', color: 'text-rose-600', bg: 'bg-rose-100' };
            default: return { icon: 'pi pi-bolt', color: 'text-slate-600', bg: 'bg-slate-100' };
        }
    };

    const formatRelativeTime = (date: string) => {
        const diff = new Date().getTime() - new Date(date).getTime();
        const minutes = Math.floor(diff / 60000);
        if (minutes < 1) return 'Az önce';
        if (minutes < 60) return `${minutes} dk önce`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours} saat önce`;
        return new Date(date).toLocaleDateString('tr-TR');
    };

    const insightCards = [
        {
            title: 'Yenileme Hızı',
            value: statChanges.renewedThisMonth?.value || '0%',
            subtitle: 'Bu ay yenilenen poliçe oranı',
            tone: statChanges.renewedThisMonth?.tone || 'neutral'
        },
        {
            title: 'Prim Toplamı',
            value: formatCompactCurrency(stats.totalPremium),
            subtitle: 'Yıllık projeksiyon bazlı',
            tone: statChanges.totalPremium?.tone || 'neutral'
        },
        {
            title: 'Aktif Şirket',
            value: formatNumber(stats.totalCompanies),
            subtitle: 'Portföydeki kurumsal müşteriler',
            tone: 'neutral'
        },
        {
            title: 'Bekleyen Yenileme',
            value: formatNumber(stats.pendingRenewals),
            subtitle: 'Bu hafta müdahale bekleyen',
            tone: statChanges.pendingRenewals?.tone || 'neutral' as any
        }
    ];

    const healthProgress = [
        { label: 'SLA uyumu', value: operations.successRate, target: operations.slaTarget },
        { label: 'İşlem süresi hedefi', value: Math.max(0, 120 - operations.avgProcessingHours * 10), target: 120 },
        { label: 'Kuyruk/kazanım', value: Math.max(0, 100 - operations.backlog), target: 100 }
    ];

    return (
        <div className="flex flex-col gap-6 pb-10">
            <section className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 p-6 sm:p-8 text-white shadow-2xl shadow-slate-900/40">
                <div className="absolute -right-16 top-2 h-40 w-40 rounded-full bg-emerald-500/20 blur-3xl"></div>
                <div className="absolute -left-10 bottom-4 h-48 w-48 rounded-full bg-indigo-500/20 blur-3xl"></div>
                <div className="relative z-10 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
                    <div className="space-y-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-200">Analytics hub</p>
                        <h1 className="text-3xl font-semibold leading-tight sm:text-4xl">Kurumsal portföyünüzün gerçek zamanlı izleme merkezi</h1>
                        <p className="max-w-2xl text-sm sm:text-base text-white/70">
                            Sağlık skorları, hızlanan yenileme ve yeni satış fırsatlarını tek ekranda görün. Riskleri erkenden tespit edip önceliklendirin.
                        </p>
                        <div className="flex flex-wrap gap-3 text-xs font-semibold">
                            <span className="inline-flex items-center gap-2 rounded-full border border-white/25 px-3 py-1 text-white/80">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
                                SLA: %{operations.slaTarget}
                            </span>
                            <span className="inline-flex items-center gap-2 rounded-full border border-white/25 px-3 py-1 text-white/80">
                                <span className="h-1.5 w-1.5 rounded-full bg-sky-400"></span>
                                Otomatik onay: %{operations.successRate}
                            </span>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        {kpiCards.map((card) => (
                            <div key={card.title} className="rounded-[22px] border border-white/10 bg-white/10 px-4 py-3 backdrop-blur-xl shadow-[0_20px_55px_rgba(15,23,42,0.35)]">
                                <p className="text-xs text-white/60">{card.title}</p>
                                <p className="mt-3 text-xl font-semibold text-white">{loading ? <span className="inline-block h-6 w-14 animate-pulse rounded bg-white/20"></span> : card.value}</p>
                                <p className="text-[11px] text-white/60">{card.helper}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {insightCards.map((card) => (
                        <div key={card.title} className="app-card rounded-[20px] border border-slate-100/70 p-4">
                            <div className="flex items-center justify-between">
                                <p className="text-sm font-semibold text-slate-700">{card.title}</p>
                                <span className={`text-[13px] font-semibold ${card.tone === 'positive' ? 'text-emerald-600' : card.tone === 'negative' ? 'text-rose-600' : 'text-slate-400'}`}>
                                    {card.tone === 'positive' ? '▲' : card.tone === 'negative' ? '▼' : '•'}
                                </span>
                            </div>
                            <p className="mt-3 text-2xl font-semibold text-slate-900">{card.value}</p>
                            <p className="mt-2 text-xs text-slate-500">{card.subtitle}</p>
                        </div>
                    ))}
                </div>
                <div className="app-card rounded-[24px] border border-slate-100/70 p-5 space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-semibold text-slate-900">Operasyon Sağlığı</h3>
                            <p className="text-sm text-slate-500">SLA, iş süresi ve kuyruk kontrolü</p>
                        </div>
                        <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Canlı</span>
                    </div>
                    {healthProgress.map((metric) => {
                        const safeValue = Math.min(Math.max(metric.value, 0), 100);
                        return (
                            <div key={metric.label} className="space-y-1">
                                <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                                    <span>{metric.label}</span>
                                    <span>{safeValue.toFixed(0)} / {metric.target}{metric.target === 100 ? '%' : ''}</span>
                                </div>
                                <div className="h-2 rounded-full bg-slate-100">
                                    <div className="h-2 rounded-full bg-gradient-to-r from-emerald-500 via-sky-500 to-amber-500 transition-all" style={{ width: `${safeValue}%` }}></div>
                                </div>
                            </div>
                        );
                    })}
                    <div className="pt-2">
                        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Ortalama işlem süresi</p>
                        <p className="text-lg font-semibold text-slate-900">{loading ? '...' : `${operations.avgProcessingHours.toFixed(1)} saat`}</p>
                    </div>
                    <div className="rounded-2xl border border-dashed border-slate-200 px-3 py-2 text-sm text-slate-500">
                        Kuyrukta <strong className="text-slate-900">{loading ? '...' : `${operations.backlog} iş`}</strong> bulunuyor, SLA hedefi %{operations.slaTarget}.
                    </div>
                </div>
            </section>

            <section className="grid grid-cols-1 xl:grid-cols-[1.4fr_0.6fr] gap-4">
                <div className="app-card rounded-[24px] p-5 sm:p-6">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h3 className="text-lg font-semibold text-slate-900">Poliçe Performansı</h3>
                            <p className="text-sm text-slate-500">Yenileme ve satış trendi ({chartRange === '6m' ? '6 ay' : '12 ay'})</p>
                        </div>
                        <div className="flex gap-2">
                            {['6m', '12m'].map((range) => (
                                <button
                                    key={range}
                                    className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${chartRange === range ? 'border-slate-300 bg-slate-100 text-slate-700' : 'border-transparent text-slate-400 hover:border-slate-200'}`}
                                    onClick={() => setChartRange(range as ChartRangeKey)}
                                >
                                    {range === '6m' ? '6 Ay' : '1 Yıl'}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="mt-4 h-[240px] sm:h-[320px]">
                        {chartLoading ? (
                            <div className="h-full w-full animate-pulse rounded-2xl bg-slate-100"></div>
                        ) : (
                            <Line data={chartData} options={chartOptions} />
                        )}
                    </div>
                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                        <div className="rounded-2xl border border-slate-100/80 bg-slate-50/80 px-4 py-3">
                            <p className="text-xs text-slate-500">Yenileme oranı</p>
                            <p className="text-lg font-semibold text-slate-900">{statChanges.renewedThisMonth.value}</p>
                            <p className="text-[11px] text-slate-400">Son 30 günlük karşılaştırma</p>
                        </div>
                        <div className="rounded-2xl border border-slate-100/80 bg-slate-50/80 px-4 py-3">
                            <p className="text-xs text-slate-500">Prim trendi</p>
                            <p className="text-lg font-semibold text-slate-900">{formatCompactCurrency(stats.totalPremium)}</p>
                            <p className="text-[11px] text-slate-400">Akümülatif gelir tahmini</p>
                        </div>
                    </div>
                </div>
                <div className="flex flex-col gap-4">
                    <div className="app-card rounded-[24px] p-5 sm:p-6">
                        <div className="flex items-start justify-between">
                            <div>
                                <h3 className="text-base font-semibold text-slate-900">Poliçe Dağılımı</h3>
                                <p className="text-xs text-slate-500">Ürün tipine göre</p>
                            </div>
                            <span className="text-[11px] font-semibold text-slate-500">{doughnutData.labels?.length ?? 0} kategori</span>
                        </div>
                        <div className="mt-4 h-[200px] flex-center">
                            {chartLoading ? (
                                <div className="h-[160px] w-[160px] rounded-full bg-slate-100 animate-pulse"></div>
                            ) : (
                                <Doughnut data={doughnutData} options={doughnutOptions} />
                            )}
                        </div>
                    </div>
                    <div className="app-card rounded-[24px] p-5 sm:p-6">
                        <div className="flex items-start justify-between">
                            <div>
                                <h3 className="text-base font-semibold text-slate-900">Risk & Fırsat</h3>
                                <p className="text-xs text-slate-500">Öncelikli aksiyonlar</p>
                            </div>
                            <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-600">Öneri</span>
                        </div>
                        <ul className="mt-4 space-y-3 text-sm text-slate-500">
                            <li className="flex items-center gap-2 rounded-xl border border-slate-100 bg-white/80 px-3 py-2">
                                <span className="inline-flex h-2 w-2 rounded-full bg-amber-400"></span>
                                122 poliçe yakın zamanda yenileniyor → hızlı teklif güncellemesi yap.
                            </li>
                            <li className="flex items-center gap-2 rounded-xl border border-slate-100 bg-white/80 px-3 py-2">
                                <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400"></span>
                                Yenilenme oranı %{statChanges.renewedThisMonth.value.replace('%', '')} seviyesinde; otomatik hatırlatmalar yayında.
                            </li>
                            <li className="flex items-center gap-2 rounded-xl border border-slate-100 bg-white/80 px-3 py-2">
                                <span className="inline-flex h-2 w-2 rounded-full bg-slate-400"></span>
                                {operations.backlog} iş sırası var → kritik müşteriler için SLA takibi yap.
                            </li>
                        </ul>
                    </div>
                </div>
            </section>

            <section className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-4">
                <div className="app-card rounded-[28px] p-5 sm:p-6 space-y-4">
                    <div className="flex items-start justify-between">
                        <div>
                            <h3 className="text-lg font-semibold text-slate-900">Hızlı İşlemler</h3>
                            <p className="text-sm text-slate-500">Öne çıkan aksiyon kartları</p>
                        </div>
                        <button className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50">Kısayolları düzenle</button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {quickActions.filter((action) => action.roles.includes(userRole)).map((action) => (
                            <button
                                key={action.label}
                                onClick={() => router.push(action.href)}
                                className="group flex h-full flex-col gap-3 rounded-[20px] border border-slate-100 px-4 py-3 text-left transition hover:border-slate-300"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="h-10 w-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                                        <i className={`${action.icon} text-base`}></i>
                                    </div>
                                    <i className="pi pi-arrow-up-right text-slate-400 transition duration-300 group-hover:text-slate-600"></i>
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-slate-900">{action.label}</p>
                                    <p className="text-xs text-slate-500">{action.desc}</p>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
                <div className="app-card rounded-[28px] p-5 sm:p-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-semibold text-slate-900">Canlı Aktivite</h3>
                            <p className="text-sm text-slate-500">Sistemdeki son işlemler</p>
                        </div>
                        <span className="text-xs font-semibold text-emerald-600">{activityItems.length} kayıt</span>
                    </div>
                    <div className="space-y-3">
                        {activityItems.length === 0 ? (
                            <div className="text-center text-sm text-slate-400">Henüz aktivite bulunmuyor</div>
                        ) : activityItems.map((item, idx) => {
                            const style = getActivityIcon(item.type);
                            return (
                                <div key={item.id || idx} className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-white/80 px-3 py-3">
                                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${style.bg} ${style.color}`}>
                                        <i className={`${style.icon} text-base`}></i>
                                    </div>

                                    <div className="flex-1">
                                        <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                                        <p className="text-xs text-slate-500 line-clamp-2">{item.description}</p>
                                    </div>
                                    <span className="text-[11px] text-slate-400">{formatRelativeTime(item.createdAt)}</span>
                                </div>
                            );
                        })}
                    </div>
                    <button className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">
                        Tüm aktiviteleri görüntüle →
                    </button>
                </div>
            </section>

            <style jsx>{`
                @keyframes fade-up {
                    0% {
                        opacity: 0;
                        transform: translateY(14px);
                    }
                    100% {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                .animate-fade-up {
                    animation: fade-up 600ms ease-out both;
                }
                .animate-fade-up-delay-1 {
                    animation: fade-up 600ms ease-out 120ms both;
                }
                .animate-fade-up-delay-2 {
                    animation: fade-up 600ms ease-out 240ms both;
                }
                .animate-fade-up-delay-3 {
                    animation: fade-up 600ms ease-out 360ms both;
                }
                .animate-fade-up-delay-4 {
                    animation: fade-up 600ms ease-out 480ms both;
                }
                .flex-center {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .line-clamp-2 {
                    display: -webkit-box;
                    -webkit-box-orient: vertical;
                    -webkit-line-clamp: 2;
                    overflow: hidden;
                }
            `}</style>
        </div>
    );
}

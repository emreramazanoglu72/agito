'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../../../../lib/api';
import { useCustomerDashboardStats } from '@/hooks/queries/useDashboard';

export default function CustomerDashboardPage() {
    const router = useRouter();
    const [companyId, setCompanyId] = useState<string | null>(null);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setCompanyId(localStorage.getItem('tenantId'));
        }
    }, []);

    const { data, isLoading } = useCustomerDashboardStats(companyId);

    const summary = data?.summary || {
        policies: 0,
        employees: 0,
        overdue: 0,
        totalPremium: 0
    };

    const highlights = {
        renewals: (data?.policies || []).filter((p: any) => p.status === 'PENDING_RENEWAL').slice(0, 5),
        overduePayments: data?.overduePayments || [],
        recentEmployees: data?.employees || [],
        activities: data?.activities || []
    };

    const loading = isLoading;

    const currencyFormatter = useMemo(() => new Intl.NumberFormat('tr-TR', {
        style: 'currency',
        currency: 'TRY',
        maximumFractionDigits: 0
    }), []);

    const formatShortDate = (value?: string) => {
        if (!value) return '-';
        const date = new Date(value);
        return Number.isNaN(date.getTime())
            ? '-'
            : date.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' });
    };

    const getActivityIcon = (type: string) => {
        switch (type) {
            case 'EMPLOYEE_CREATED': return { icon: 'pi pi-user-plus', color: 'text-emerald-600', bg: 'bg-emerald-100' };
            case 'POLICY_CREATED': return { icon: 'pi pi-check-circle', color: 'text-sky-600', bg: 'bg-sky-100' };
            case 'POLICY_UPDATED': return { icon: 'pi pi-pencil', color: 'text-amber-600', bg: 'bg-amber-100' };
            case 'PAYMENT_OVERDUE': return { icon: 'pi pi-exclamation-triangle', color: 'text-rose-600', bg: 'bg-rose-100' };
            default: return { icon: 'pi pi-bolt', color: 'text-slate-600', bg: 'bg-slate-100' };
        }
    };

    const formatRelativeTime = (date: string) => {
        const diff = new Date().getTime() - new Date(date).getTime();
        const minutes = Math.floor(diff / 60000);
        if (minutes < 1) return 'Az once';
        if (minutes < 60) return `${minutes} dk once`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours} saat once`;
        return new Date(date).toLocaleDateString('tr-TR');
    };

    const actionCards = [
        {
            title: 'Yeni calisan ekle',
            description: 'Ekip uyelerini hizlica sisteme al.',
            href: '/customer/employees',
            icon: 'pi pi-user-plus',
            tone: 'bg-emerald-500'
        },
        {
            title: 'Yenileme listesi',
            description: 'Yaklasan policeleri gozden gecir.',
            href: '/customer/policies',
            icon: 'pi pi-sync',
            tone: 'bg-sky-500'
        },
        {
            title: 'Tahsilat takibi',
            description: 'Gecikmeleri ve odemeleri takip et.',
            href: '/customer/payments',
            icon: 'pi pi-wallet',
            tone: 'bg-amber-500'
        },
        {
            title: 'Dokuman arsivi',
            description: 'Policeleri ve sozlesmeleri gor.',
            href: '/customer/documents',
            icon: 'pi pi-folder',
            tone: 'bg-slate-800'
        }
    ];

    const statCards = [
        { label: 'Toplam police', value: summary.policies, tone: 'text-white' },
        { label: 'Toplam calisan', value: summary.employees, tone: 'text-white' },
        { label: 'Gecikmis odeme', value: summary.overdue, tone: 'text-rose-600' },
        { label: 'Toplam prim', value: currencyFormatter.format(summary.totalPremium), tone: 'text-white' }
    ];

    const onboardingSteps = [
        {
            title: 'Ekip listesini olustur',
            description: 'Ilk calisanlarini ekleyerek police atamalarini baslat.',
            action: 'Calisan ekle',
            href: '/customer/employees'
        },
        {
            title: 'Ilk policeni tanimla',
            description: 'Policeleri sisteme al ve yenileme takvimini olustur.',
            action: 'Policelere git',
            href: '/customer/policies'
        },
        {
            title: 'Tahsilat takvimini bagla',
            description: 'Odeme akisini takip etmek icin finans ekranini ac.',
            action: 'Finans paneli',
            href: '/customer/payments'
        }
    ];

    return (
        <div className="flex flex-col gap-6 pb-10">
            <section className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 p-6 sm:p-8 text-white shadow-2xl shadow-slate-900/40">
                <div className="absolute -right-20 top-4 h-48 w-48 rounded-full bg-emerald-500/15 blur-3xl"></div>
                <div className="absolute -left-16 bottom-2 h-52 w-52 rounded-full bg-sky-400/10 blur-3xl"></div>
                <div className="relative z-10 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
                    <div className="space-y-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-200">Kurumsal musteri paneli</p>
                        <h1 className="text-3xl font-semibold leading-tight sm:text-4xl">Sirketinizin sigorta operasyonlari</h1>
                        <p className="max-w-2xl text-sm text-white/70">
                            Yenilemeler, odemeler ve ekip hareketlerini tek ekranda takip edin. Oncelikli aksiyonlari
                            otomatik listelerle hizla yakalayin.
                        </p>
                        <div className="flex flex-wrap gap-3 text-xs font-semibold">
                            <span className="inline-flex items-center gap-2 rounded-full border border-white/25 px-3 py-1 text-white/80">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
                                Guncel bilgi akisi
                            </span>
                            <span className="inline-flex items-center gap-2 rounded-full border border-white/25 px-3 py-1 text-white/80">
                                <span className="h-1.5 w-1.5 rounded-full bg-sky-400"></span>
                                Kurumsal portfoy
                            </span>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        {statCards.map((card) => (
                            <div key={card.label} className="rounded-[20px] border border-white/10 bg-white/10 px-4 py-3 backdrop-blur-xl">
                                <p className="text-xs text-white/60">{card.label}</p>
                                <p className={`mt-3 text-xl font-semibold ${card.tone}`}>{loading ? '...' : card.value}</p>
                                <p className="text-[11px] text-white/50">Son 30 gun</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="app-card rounded-[24px] border border-slate-100/70 p-5 sm:p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Baslangic adimlari</p>
                        <h3 className="text-lg font-semibold text-slate-900">Kurulum listesi</h3>
                    </div>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">3 adim</span>
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-3">
                    {onboardingSteps.map((step) => (
                        <div key={step.title} className="flex h-full flex-col justify-between rounded-2xl border border-slate-100 bg-white/80 p-4">
                            <div>
                                <p className="text-sm font-semibold text-slate-900">{step.title}</p>
                                <p className="mt-2 text-xs text-slate-500">{step.description}</p>
                            </div>
                            <button
                                onClick={() => router.push(step.href)}
                                className="mt-4 inline-flex items-center justify-between rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                            >
                                {step.action}
                                <i className="pi pi-arrow-right text-[10px]"></i>
                            </button>
                        </div>
                    ))}
                </div>
            </section>

            <section className="grid grid-cols-1 gap-4 lg:grid-cols-[1.1fr_0.9fr]">
                <div className="app-card rounded-[24px] border border-slate-100/70 p-5 sm:p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Sirket akisi</p>
                            <h3 className="text-lg font-semibold text-slate-900">Yaklasan yenilemeler</h3>
                        </div>
                        <button
                            onClick={() => router.push('/customer/policies')}
                            className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                        >
                            Tum policeler -&gt;
                        </button>
                    </div>
                    <div className="mt-4 space-y-3">
                        {loading ? (
                            <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-6 text-sm text-slate-400">
                                Yukleniyor...
                            </div>
                        ) : highlights.renewals.length === 0 ? (
                            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
                                Yaklasan yenileme bulunamadi.
                            </div>
                        ) : (
                            highlights.renewals.map((policy: any) => (
                                <button
                                    key={policy.id}
                                    onClick={() => router.push(`/customer/policies/${policy.id}`)}
                                    className="flex w-full items-center justify-between rounded-2xl border border-slate-100 bg-white/80 px-4 py-3 text-left transition hover:border-slate-300"
                                >
                                    <div>
                                        <p className="text-sm font-semibold text-slate-900">{policy.policyNo || '-'}</p>
                                        <p className="text-xs text-slate-500">{policy.employee ? `${policy.employee.firstName} ${policy.employee.lastName}` : 'Calisan bilgisi yok'}</p>
                                    </div>
                                    <div className="text-right text-xs text-slate-500">
                                        <span className="block text-slate-400">Bitis</span>
                                        <span className="font-semibold text-slate-700">{formatShortDate(policy.endDate)}</span>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>
                <div className="grid gap-4">
                    <div className="app-card rounded-[24px] border border-slate-100/70 p-5 sm:p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Finans</p>
                                <h3 className="text-lg font-semibold text-slate-900">Gecikmis odemeler</h3>
                            </div>
                            <button
                                onClick={() => router.push('/customer/payments')}
                                className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                            >
                                Tahsilat ekrani -&gt;
                            </button>
                        </div>
                        <div className="mt-4 space-y-3">
                            {loading ? (
                                <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-6 text-sm text-slate-400">
                                    Yukleniyor...
                                </div>
                            ) : highlights.overduePayments.length === 0 ? (
                                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
                                    Gecikmis odeme bulunamadi.
                                </div>
                            ) : (
                                highlights.overduePayments.map((payment: any) => (
                                    <div key={payment.id} className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white/80 px-4 py-3">
                                        <div>
                                            <p className="text-sm font-semibold text-slate-900">{payment.policy?.policyNo || '-'}</p>
                                            <p className="text-xs text-slate-500">
                                                {payment.policy?.employee
                                                    ? `${payment.policy.employee.firstName} ${payment.policy.employee.lastName}`
                                                    : 'Calisan bilgisi yok'}
                                            </p>
                                        </div>
                                        <div className="text-right text-xs text-slate-500">
                                            <span className="block text-slate-400">Tutar</span>
                                            <span className="font-semibold text-rose-600">{currencyFormatter.format(payment.amount || 0)}</span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                    <div className="app-card rounded-[24px] border border-slate-100/70 p-5 sm:p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Ekip</p>
                                <h3 className="text-lg font-semibold text-slate-900">Son eklenen calisanlar</h3>
                            </div>
                            <button
                                onClick={() => router.push('/customer/employees')}
                                className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                            >
                                Tum calisanlar -&gt;
                            </button>
                        </div>
                        <div className="mt-4 space-y-3">
                            {loading ? (
                                <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-6 text-sm text-slate-400">
                                    Yukleniyor...
                                </div>
                            ) : highlights.recentEmployees.length === 0 ? (
                                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
                                    Calisan kaydi bulunamadi.
                                </div>
                            ) : (
                                highlights.recentEmployees.map((employee: any) => (
                                    <button
                                        key={employee.id}
                                        onClick={() => router.push(`/customer/employees/${employee.id}`)}
                                        className="flex w-full items-center justify-between rounded-2xl border border-slate-100 bg-white/80 px-4 py-3 text-left transition hover:border-slate-300"
                                    >
                                        <div>
                                            <p className="text-sm font-semibold text-slate-900">{employee.firstName} {employee.lastName}</p>
                                            <p className="text-xs text-slate-500">{employee.department?.name ?? 'Departman atanmadi'}</p>
                                        </div>
                                        <span className="text-xs font-semibold text-slate-500">{formatShortDate(employee.createdAt)}</span>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </section>

            <section className="grid grid-cols-1 gap-4 lg:grid-cols-[1.1fr_0.9fr]">
                <div className="app-card rounded-[24px] border border-slate-100/70 p-5 sm:p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Bildirimler</p>
                            <h3 className="text-lg font-semibold text-slate-900">Sirket aktivite akisi</h3>
                        </div>
                        <button className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50">
                            Tumu -&gt;
                        </button>
                    </div>
                    <div className="mt-4 space-y-3">
                        {loading ? (
                            <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-6 text-sm text-slate-400">
                                Yukleniyor...
                            </div>
                        ) : highlights.activities.length === 0 ? (
                            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
                                Henuz aktivite bulunmuyor.
                            </div>
                        ) : (
                            highlights.activities.map((item: any, idx: number) => {
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
                            })
                        )}
                    </div>
                </div>
                <div className="app-card rounded-[24px] border border-slate-100/70 p-5 sm:p-6">
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Aksiyon merkezi</p>
                    <h3 className="mt-2 text-lg font-semibold text-slate-900">Gunun oncelikli isleri</h3>
                    <div className="mt-4 space-y-3">
                        {actionCards.map((action) => (
                            <button
                                key={action.title}
                                onClick={() => router.push(action.href)}
                                className="flex w-full items-center gap-3 rounded-2xl border border-slate-100 bg-white/80 px-4 py-3 text-left transition hover:border-slate-300"
                            >
                                <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${action.tone} text-white`}>
                                    <i className={`${action.icon} text-base`}></i>
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-slate-900">{action.title}</p>
                                    <p className="text-xs text-slate-500">{action.description}</p>
                                </div>
                            </button>
                        ))}
                    </div>
                    <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-500">
                        Yeni talepler ve bildirimler icin takiminizi bilgilendirin.
                    </div>
                </div>
            </section>

            <style jsx>{`
                .line-clamp-2 {
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                }
            `}</style>
        </div>
    );
}

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { api } from '../../../../lib/api';
import { Button } from '../../../../components/atoms/Button';

const statusStyles: Record<string, { label: string; variant: 'success' | 'warning' | 'danger' | 'secondary' | 'default' }> = {
    DRAFT: { label: 'Taslak', variant: 'secondary' },
    SUBMITTED: { label: 'Gonderildi', variant: 'default' },
    IN_REVIEW: { label: 'Inceleme', variant: 'warning' },
    NEEDS_INFO: { label: 'Ek Bilgi', variant: 'warning' },
    APPROVED: { label: 'Onaylandi', variant: 'success' },
    REJECTED: { label: 'Reddedildi', variant: 'danger' },
    ACTIVE: { label: 'Aktif', variant: 'success' },
};

export default function CustomerApplicationsPage() {
    const router = useRouter();
    const [applications, setApplications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        const fetchApplications = async () => {
            setLoading(true);
            try {
                const res = await api.get('/applications');
                if (!cancelled) {
                    setApplications(res.data || []);
                }
            } catch (error) {
                console.error(error);
            } finally {
                if (!cancelled) setLoading(false);
            }
        };
        fetchApplications();
        return () => {
            cancelled = true;
        };
    }, []);

    return (
        <div className="flex flex-col gap-6 pb-10">
            <section className="rounded-[28px] bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 p-6 sm:p-8 text-white shadow-2xl shadow-slate-900/40">
                <div className="flex flex-col gap-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.4em] text-emerald-200">Basvurular</p>
                    <h2 className="text-3xl font-semibold leading-tight">Kurumsal basvuru listesi</h2>
                    <p className="max-w-3xl text-sm text-white/70">
                        Paket basvurularinizi buradan izleyin. Admin onay sureci tamamlandiginda policeniz aktiflesir.
                    </p>
                </div>
                <div className="mt-6">
                    <Button onClick={() => router.push('/customer/applications/new')} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                        Yeni basvuru olustur
                    </Button>
                </div>
            </section>

            <section className="app-card rounded-[24px] border border-slate-100/70 p-5 sm:p-6">
                {loading ? (
                    <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-10 text-center text-sm text-slate-400">
                        Yukleniyor...
                    </div>
                ) : applications.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
                        Henuz basvuru bulunmuyor.
                    </div>
                ) : (
                    <div className="space-y-3">
                        {applications.map((app) => {
                            const status = statusStyles[app.status] || { label: app.status, variant: 'secondary' };
                            return (
                                <button
                                    key={app.id}
                                    type="button"
                                    onClick={() => router.push(`/customer/applications/${app.id}`)}
                                    className="flex w-full flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-white/80 px-4 py-3 text-left transition hover:border-slate-300"
                                >
                                    <div>
                                        <p className="text-sm font-semibold text-slate-900">{app.package?.name || 'Paket'}</p>
                                        <p className="text-xs text-slate-500">{app.companyName} • {app.employeeCount} calisan</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge variant={status.variant}>{status.label}</Badge>
                                        <span className="text-xs text-slate-400">{new Date(app.createdAt).toLocaleDateString('tr-TR')}</span>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                )}
            </section>
        </div>
    );
}

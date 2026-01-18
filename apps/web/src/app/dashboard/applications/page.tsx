'use client';

import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { api } from '../../../lib/api';

const statusOptions = [
    'SUBMITTED',
    'IN_REVIEW',
    'NEEDS_INFO',
    'APPROVED',
    'REJECTED',
    'ACTIVE',
];

const statusLabels: Record<string, string> = {
    SUBMITTED: 'Gonderildi',
    IN_REVIEW: 'Inceleme',
    NEEDS_INFO: 'Ek Bilgi',
    APPROVED: 'Onaylandi',
    REJECTED: 'Reddedildi',
    ACTIVE: 'Aktif',
};

const statusVariant: Record<string, 'success' | 'warning' | 'danger' | 'secondary' | 'default'> = {
    SUBMITTED: 'default',
    IN_REVIEW: 'warning',
    NEEDS_INFO: 'warning',
    APPROVED: 'success',
    REJECTED: 'danger',
    ACTIVE: 'success',
};

export default function ApplicationsAdminPage() {
    const [applications, setApplications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState<any | null>(null);
    const [note, setNote] = useState('');
    const [status, setStatus] = useState('IN_REVIEW');
    const [saving, setSaving] = useState(false);

    const fetchApplications = async () => {
        setLoading(true);
        try {
            const res = await api.get('/applications');
            setApplications(res.data || []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchApplications();
    }, []);

    const handleSelect = (app: any) => {
        setSelected(app);
        setStatus(app.status || 'IN_REVIEW');
        setNote(app.adminNote || '');
    };

    const handleSave = async () => {
        if (!selected) return;
        setSaving(true);
        try {
            await api.patch(`/applications/${selected.id}`, { status, adminNote: note });
            await fetchApplications();
            const updated = applications.find((app) => app.id === selected.id);
            setSelected(updated || null);
        } catch (error) {
            console.error(error);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="flex flex-col gap-6 pb-10">
            <section className="rounded-[28px] bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 p-6 sm:p-8 text-white shadow-2xl shadow-slate-900/40">
                <div className="flex flex-col gap-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.4em] text-emerald-200">Basvuru paneli</p>
                    <h2 className="text-3xl font-semibold leading-tight">Kurumsal basvuru onaylari</h2>
                    <p className="max-w-3xl text-sm text-white/70">
                        Yeni basvurulari inceleyin, ek bilgi isteyin veya onaylayin.
                    </p>
                </div>
            </section>

            <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
                <div className="app-card rounded-[24px] border border-slate-100/70 p-5 sm:p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Basvurular</p>
                            <h3 className="text-lg font-semibold text-slate-900">Guncel talepler</h3>
                        </div>
                        <span className="text-xs font-semibold text-slate-500">{applications.length} kayit</span>
                    </div>
                    <div className="mt-4 space-y-3">
                        {loading ? (
                            <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-10 text-center text-sm text-slate-400">
                                Yukleniyor...
                            </div>
                        ) : applications.length === 0 ? (
                            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
                                Basvuru bulunmuyor.
                            </div>
                        ) : (
                            applications.map((app) => (
                                <button
                                    key={app.id}
                                    onClick={() => handleSelect(app)}
                                    className={`flex w-full flex-wrap items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left transition hover:border-slate-300 ${selected?.id === app.id ? 'border-emerald-400 bg-emerald-50/40' : 'border-slate-100 bg-white/80'}`}
                                >
                                    <div>
                                        <p className="text-sm font-semibold text-slate-900">{app.companyName}</p>
                                        <p className="text-xs text-slate-500">{app.package?.name || 'Paket'} • {app.employeeCount} calisan</p>
                                        <p className="text-[11px] text-slate-400">{app.carrier?.name || 'Marka secilmedi'}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge variant={statusVariant[app.status] || 'secondary'}>{statusLabels[app.status] || app.status}</Badge>
                                        <span className="text-xs text-slate-400">{new Date(app.createdAt).toLocaleDateString('tr-TR')}</span>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>

                <div className="app-card rounded-[24px] border border-slate-100/70 p-5 sm:p-6">
                    {!selected ? (
                        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
                            Detay gormek icin basvuru secin.
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Basvuru detayi</p>
                                <h3 className="mt-2 text-lg font-semibold text-slate-900">{selected.companyName}</h3>
                                <p className="text-xs text-slate-500">{selected.companyEmail} • {selected.companyPhone}</p>
                            </div>
                            <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                                <p className="text-xs text-slate-500">Paket</p>
                                <p className="text-sm font-semibold text-slate-900">{selected.package?.name}</p>
                                <p className="text-xs text-slate-500">{selected.package?.priceRange}</p>
                            </div>
                            <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                                <p className="text-xs text-slate-500">Kurumsal sozlesme</p>
                                <p className="text-sm font-semibold text-slate-900">
                                    {selected.corporatePolicy ? 'Olusturuldu' : 'Beklemede'}
                                </p>
                                {selected.corporatePolicy?.status && (
                                    <p className="text-xs text-slate-500">{selected.corporatePolicy.status}</p>
                                )}
                                {selected.corporatePolicy?.id && (
                                    <button
                                        type="button"
                                        onClick={() => window.location.assign(`/dashboard/corporate-policies/${selected.corporatePolicy.id}`)}
                                        className="mt-2 inline-flex items-center gap-2 text-xs font-semibold text-emerald-600 hover:text-emerald-700"
                                    >
                                        Sozlesmeye git
                                        <i className="pi pi-arrow-right text-[10px]"></i>
                                    </button>
                                )}
                            </div>
                            <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                                <p className="text-xs text-slate-500">Sigorta markasi</p>
                                <p className="text-sm font-semibold text-slate-900">{selected.carrier?.name || '-'}</p>
                                <p className="text-xs text-slate-500">{selected.carrier?.code || ''}</p>
                            </div>
                            <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                                <p className="text-xs text-slate-500">Calisan bilgisi</p>
                                <p className="text-sm font-semibold text-slate-900">{selected.employeeCount} calisan</p>
                                <p className="text-xs text-slate-500">Liste: {selected.employeeList?.length || 0} kisi</p>
                            </div>
                            <div>
                                <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Durum</label>
                                <select
                                    value={status}
                                    onChange={(event) => setStatus(event.target.value)}
                                    className="mt-2 h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
                                >
                                    {statusOptions.map((opt) => (
                                        <option key={opt} value={opt}>{statusLabels[opt]}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Admin notu</label>
                                <Textarea
                                    value={note}
                                    onChange={(event) => setNote(event.target.value)}
                                    placeholder="Onay veya revizyon notu yazin"
                                    className="mt-2"
                                />
                            </div>
                            <Button onClick={handleSave} disabled={saving}>
                                {saving ? 'Kaydediliyor...' : 'Durumu guncelle'}
                            </Button>
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}

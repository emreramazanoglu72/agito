'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '../../../../../components/atoms/Button';
import { Input } from '../../../../../components/atoms/Input';
import { Textarea } from '@/components/ui/textarea';
import { api } from '../../../../../lib/api';
import { useToast } from '@/components/ui/use-toast';

const statusLabels: Record<string, { label: string; variant: 'success' | 'warning' | 'danger' | 'secondary' | 'default' }> = {
    DRAFT: { label: 'Taslak', variant: 'secondary' },
    SUBMITTED: { label: 'Gonderildi', variant: 'default' },
    IN_REVIEW: { label: 'Inceleme', variant: 'warning' },
    NEEDS_INFO: { label: 'Ek Bilgi', variant: 'warning' },
    APPROVED: { label: 'Onaylandi', variant: 'success' },
    REJECTED: { label: 'Reddedildi', variant: 'danger' },
    ACTIVE: { label: 'Aktif', variant: 'success' },
};

export default function ApplicationDetailPage() {
    const router = useRouter();
    const params = useParams();
    const { toast } = useToast();
    const [application, setApplication] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [message, setMessage] = useState('');
    const [sending, setSending] = useState(false);

    const id = params?.id as string;

    const fetchApplication = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/applications/${id}`);
            setApplication(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (id) fetchApplication();
    }, [id]);

    const handleUpload = async () => {
        if (!file) return;
        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            await api.post(`/applications/${id}/documents`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setFile(null);
            toast({ title: 'Dokuman yuklendi', description: 'Basvuruya eklendi.' });
            fetchApplication();
        } catch (error) {
            console.error(error);
            toast({ title: 'Yukleme basarisiz', description: 'Dokuman eklenemedi.' });
        } finally {
            setUploading(false);
        }
    };

    const handleSendUpdate = async () => {
        if (!message.trim()) return;
        setSending(true);
        try {
            await api.post(`/applications/${id}/updates`, { message });
            setMessage('');
            toast({ title: 'Gonderildi', description: 'Ek bilgi notu paylasildi.' });
            fetchApplication();
        } catch (error) {
            console.error(error);
            toast({ title: 'Islem basarisiz', description: 'Not gonderilemedi.' });
        } finally {
            setSending(false);
        }
    };

    if (loading) {
        return <div className="p-10 text-center text-slate-500">Yukleniyor...</div>;
    }

    if (!application) {
        return <div className="p-10 text-center text-slate-500">Basvuru bulunamadi.</div>;
    }

    const status = statusLabels[application.status] || { label: application.status, variant: 'secondary' };

    return (
        <div className="flex flex-col gap-6 pb-10">
            <section className="rounded-[28px] bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 p-6 sm:p-8 text-white shadow-2xl shadow-slate-900/40">
                <div className="flex flex-col gap-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.4em] text-emerald-200">Basvuru detayi</p>
                    <h2 className="text-3xl font-semibold leading-tight">{application.companyName}</h2>
                    <p className="max-w-3xl text-sm text-white/70">
                        {application.package?.name} • {application.employeeCount} calisan
                    </p>
                </div>
                <div className="mt-6 flex items-center gap-3">
                    <Badge variant={status.variant}>{status.label}</Badge>
                    <span className="text-xs text-white/70">{new Date(application.createdAt).toLocaleDateString('tr-TR')}</span>
                </div>
            </section>

            <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
                <div className="app-card rounded-[24px] border border-slate-100/70 p-5 sm:p-6 space-y-4">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Basvuru ozeti</p>
                        <h3 className="text-lg font-semibold text-slate-900">Bilgiler</h3>
                    </div>
                    <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                        <p className="text-xs text-slate-500">Paket</p>
                        <p className="text-sm font-semibold text-slate-900">{application.package?.name}</p>
                        <p className="text-xs text-slate-500">{application.package?.priceRange}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                        <p className="text-xs text-slate-500">Sigorta markasi</p>
                        <p className="text-sm font-semibold text-slate-900">{application.carrier?.name || '-'}</p>
                        <p className="text-xs text-slate-500">{application.carrier?.code || ''}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                        <p className="text-xs text-slate-500">Kurumsal sozlesme</p>
                        <p className="text-sm font-semibold text-slate-900">
                            {application.corporatePolicy ? 'Olusturuldu' : 'Onay bekliyor'}
                        </p>
                        {application.corporatePolicy?.status && (
                            <p className="text-xs text-slate-500">{application.corporatePolicy.status}</p>
                        )}
                        {application.corporatePolicy?.id && (
                            <button
                                type="button"
                                onClick={() => router.push(`/customer/corporate-policies/${application.corporatePolicy.id}`)}
                                className="mt-2 inline-flex items-center gap-2 text-xs font-semibold text-emerald-600 hover:text-emerald-700"
                            >
                                Sozlesmeyi gor
                                <i className="pi pi-arrow-right text-[10px]"></i>
                            </button>
                        )}
                    </div>
                    <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                        <p className="text-xs text-slate-500">Iletisim</p>
                        <p className="text-sm font-semibold text-slate-900">{application.companyEmail}</p>
                        <p className="text-xs text-slate-500">{application.companyPhone}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                        <p className="text-xs text-slate-500">Calisan listesi</p>
                        <p className="text-sm font-semibold text-slate-900">{application.employeeList?.length || 0} kisi</p>
                        <p className="text-xs text-slate-500">Toplam: {application.employeeCount}</p>
                    </div>
                    {application.adminNote && (
                        <div className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                            Admin notu: {application.adminNote}
                        </div>
                    )}
                </div>

                <div className="app-card rounded-[24px] border border-slate-100/70 p-5 sm:p-6 space-y-4">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Dokumanlar</p>
                        <h3 className="text-lg font-semibold text-slate-900">Basvuru dosyalari</h3>
                    </div>
                    <div className="space-y-3">
                        {(application.documents || []).length === 0 ? (
                            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
                                Dokuman bulunmuyor.
                            </div>
                        ) : (
                            application.documents.map((doc: any) => (
                                <a
                                    key={doc.id}
                                    href={doc.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white/80 px-4 py-3"
                                >
                                    <div>
                                        <p className="text-sm font-semibold text-slate-900">{doc.name}</p>
                                        <p className="text-xs text-slate-500">{Math.round(doc.size / 1024)} KB</p>
                                    </div>
                                    <i className="pi pi-download text-xs text-slate-500"></i>
                                </a>
                            ))
                        )}
                    </div>
                    <div className="flex flex-col gap-2">
                        <Input id="doc-file" type="file" onChange={(event) => setFile(event.target.files?.[0] || null)} />
                        <Button onClick={handleUpload} loading={uploading} disabled={!file}>
                            Dokuman yukle
                        </Button>
                    </div>
                </div>
            </section>

            <section className="app-card rounded-[24px] border border-slate-100/70 p-5 sm:p-6">
                <div className="flex flex-col gap-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Ek bilgi</p>
                    <h3 className="text-lg font-semibold text-slate-900">Admin ile yazisma</h3>
                </div>
                <div className="mt-4 space-y-3">
                    {(application.updates || []).length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
                            Henuz not eklenmedi.
                        </div>
                    ) : (
                        application.updates.map((update: any) => (
                            <div key={update.id} className="rounded-2xl border border-slate-100 bg-white/80 px-4 py-3 text-sm text-slate-600">
                                {update.message}
                            </div>
                        ))
                    )}
                </div>
                <div className="mt-4 grid gap-3">
                    <Textarea
                        value={message}
                        onChange={(event) => setMessage(event.target.value)}
                        placeholder="Ek bilgi veya not ekleyin"
                    />
                    <Button onClick={handleSendUpdate} loading={sending}>
                        Notu gonder
                    </Button>
                </div>
            </section>

            <div className="flex justify-end">
                <Button variant="outline" onClick={() => router.push('/customer/applications')}>Listeye don</Button>
            </div>
        </div>
    );
}

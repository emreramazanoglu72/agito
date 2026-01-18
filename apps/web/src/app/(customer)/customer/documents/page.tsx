'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Input } from '../../../../components/atoms/Input';
import { Button } from '../../../../components/atoms/Button';
import { api } from '../../../../lib/api';
import { useToast } from '@/components/ui/use-toast';

type DocumentItem = {
    id: string;
    kind: 'policy' | 'employee';
    category: string;
    title: string;
    fileName: string;
    fileUrl: string;
    createdAt: string;
    employeeName?: string | null;
    policyNo?: string | null;
    companyName?: string | null;
    size?: number | null;
};

export default function CustomerDocumentsPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { toast } = useToast();
    const [search, setSearch] = useState(searchParams.get('q') || '');
    const [documents, setDocuments] = useState<DocumentItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const limit = 12;
    const [uploading, setUploading] = useState(false);
    const [uploadKind, setUploadKind] = useState<'policy' | 'employee'>('policy');
    const [uploadTargetId, setUploadTargetId] = useState('');
    const [uploadType, setUploadType] = useState('POLICY_PDF');
    const [file, setFile] = useState<File | null>(null);
    const [targets, setTargets] = useState<Array<{ label: string; value: string }>>([]);

    const category = searchParams.get('category') || 'all';

    useEffect(() => {
        let cancelled = false;
        const fetchDocuments = async () => {
            setLoading(true);
            try {
                const res = await api.get('/documents', {
                    params: {
                        search: search || undefined,
                        page,
                        limit,
                        category: category === 'all' ? undefined : category,
                    },
                });
                if (!cancelled) {
                    const payload = res.data;
                    if (Array.isArray(payload)) {
                        setDocuments(payload);
                        setTotal(payload.length);
                    } else {
                        setDocuments(payload?.data || []);
                        setTotal(payload?.meta?.total || 0);
                    }
                }
            } catch (error) {
                console.error(error);
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        fetchDocuments();
        return () => {
            cancelled = true;
        };
    }, [search, page, category]);

    useEffect(() => {
        setPage(1);
        const params = new URLSearchParams();
        if (category !== 'all') params.set('category', category);
        if (search) params.set('q', search);
        const next = params.toString();
        router.replace(`/customer/documents${next ? `?${next}` : ''}`);
    }, [search, category, router]);

    useEffect(() => {
        const query = searchParams.get('q') || '';
        if (query !== search) {
            setSearch(query);
        }
    }, [searchParams]);

    useEffect(() => {
        let cancelled = false;
        const fetchTargets = async () => {
            try {
                const endpoint = uploadKind === 'policy' ? '/policies' : '/employees';
                const res = await api.get(endpoint, { params: { limit: 50 } });
                if (cancelled) return;
                const list = res.data?.data ?? res.data ?? [];
                const mapped = list.map((item: any) => ({
                    label: uploadKind === 'policy'
                        ? item.policyNo || item.id
                        : `${item.firstName} ${item.lastName}`,
                    value: item.id,
                }));
                setTargets(mapped);
            } catch (error) {
                console.error(error);
            }
        };
        fetchTargets();
        return () => {
            cancelled = true;
        };
    }, [uploadKind]);

    const filteredDocuments = useMemo(() => {
        if (category === 'all') return documents;
        if (category === 'receipt') {
            return documents.filter((doc) => doc.category.includes('receipt'));
        }
        if (category === 'contract') {
            return documents.filter((doc) => doc.category.includes('contract'));
        }
        if (category === 'policy') {
            return documents.filter((doc) => doc.kind === 'policy');
        }
        return documents;
    }, [documents, category]);

    const categoryTabs = [
        { key: 'all', label: 'Tum Dokumanlar' },
        { key: 'policy', label: 'Policeler' },
        { key: 'receipt', label: 'Faturalar' },
        { key: 'contract', label: 'Sozlesmeler' },
    ];

    const formatKindBadge = (doc: DocumentItem) => {
        if (doc.category.includes('receipt')) return 'bg-amber-100 text-amber-700';
        if (doc.category.includes('contract')) return 'bg-slate-200 text-slate-700';
        if (doc.kind === 'policy') return 'bg-emerald-100 text-emerald-700';
        return 'bg-sky-100 text-sky-700';
    };

    const totalPages = Math.max(1, Math.ceil(total / limit));

    const handleUpload = async () => {
        if (!file || !uploadTargetId) return;
        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('kind', uploadKind);
            if (uploadKind === 'policy') {
                formData.append('policyId', uploadTargetId);
                formData.append('documentType', uploadType);
            } else {
                formData.append('employeeId', uploadTargetId);
            }
            await api.post('/documents/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setFile(null);
            setUploadTargetId('');
            toast({
                title: 'Dokuman yuklendi',
                description: 'Dosya arsive eklendi.',
            });
            const res = await api.get('/documents', { params: { page, limit } });
            const payload = res.data;
            if (Array.isArray(payload)) {
                setDocuments(payload);
                setTotal(payload.length);
            } else {
                setDocuments(payload?.data || []);
                setTotal(payload?.meta?.total || 0);
            }
        } catch (error) {
            console.error(error);
            toast({
                title: 'Yukleme basarisiz',
                description: 'Dosya yuklenemedi. Tekrar deneyin.',
            });
        } finally {
            setUploading(false);
        }
    };

    const handleCopyLink = async (url: string) => {
        try {
            await navigator.clipboard.writeText(url);
            toast({ title: 'Baglanti kopyalandi', description: 'Dokuman linki panoya alindi.' });
        } catch (error) {
            console.error(error);
            toast({ title: 'Kopyalama basarisiz', description: 'Link kopyalanamadi.' });
        }
    };

    const getBadgeLabel = (doc: DocumentItem) => {
        if (doc.category.includes('receipt')) return { label: 'Fatura', icon: 'pi pi-wallet' };
        if (doc.category.includes('contract')) return { label: 'Sozlesme', icon: 'pi pi-briefcase' };
        if (doc.kind === 'policy') return { label: 'Police', icon: 'pi pi-file' };
        return { label: 'Calisan', icon: 'pi pi-users' };
    };

    const getSecondaryChips = (doc: DocumentItem) => {
        const chips: Array<{ label: string; tone: string }> = [];
        if (doc.employeeName) {
            chips.push({ label: doc.employeeName, tone: 'bg-slate-100 text-slate-600' });
        }
        if (doc.policyNo) {
            chips.push({ label: `Police ${doc.policyNo}`, tone: 'bg-emerald-50 text-emerald-600' });
        }
        if (doc.companyName) {
            chips.push({ label: doc.companyName, tone: 'bg-sky-50 text-sky-600' });
        }
        return chips;
    };

    const handleChipFilter = (label: string) => {
        if (label.startsWith('Police ')) {
            setSearch(label.replace('Police ', '').trim());
            router.push('/customer/documents?category=policy');
            return;
        }
        setSearch(label);
    };

    return (
        <div className="flex flex-col gap-6 pb-10">
            <section className="rounded-[28px] bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 p-6 sm:p-8 text-white shadow-2xl shadow-slate-900/40">
                <div className="flex flex-col gap-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.4em] text-emerald-200">Dokuman merkezi</p>
                    <h2 className="text-3xl font-semibold leading-tight">Policeler ve sozlesmeler</h2>
                    <p className="max-w-3xl text-sm text-white/70">
                        Kurumsal dosyalarinizi tek noktadan yonetin. Police, fatura ve sozlesmeleri hizla bulun.
                    </p>
                </div>
            </section>

            <section className="app-card rounded-[24px] border border-slate-100/70 p-5 sm:p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Arsiv</p>
                        <h3 className="text-lg font-semibold text-slate-900">Dokuman listesi</h3>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="relative">
                            <Input
                                id="document-search"
                                placeholder="Dokuman ara..."
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                className="h-11 bg-gray-50 border-gray-200 pr-10 focus:border-emerald-500 focus:ring-emerald-500/20"
                            />
                            {search && (
                                <button
                                    type="button"
                                    onClick={() => setSearch('')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                    title="Aramayi temizle"
                                >
                                    <i className="pi pi-times text-xs"></i>
                                </button>
                            )}
                        </div>
                    </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                    {categoryTabs.map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => router.push(`/customer/documents?category=${tab.key}`)}
                            className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${category === tab.key ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                        >
                            {tab.label}
                        </button>
                    ))}
                    {category !== 'all' && (
                        <button
                            type="button"
                            onClick={() => router.push('/customer/documents?category=all')}
                            className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-500 hover:bg-slate-50"
                        >
                            Kategori: {category === 'policy' ? 'Police' : category === 'receipt' ? 'Fatura' : 'Sozlesme'}
                        </button>
                    )}
                    {search && (
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                                Filtre: {search}
                            </span>
                            <button
                                type="button"
                                onClick={() => setSearch('')}
                                className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-100"
                            >
                                Filtreyi temizle
                            </button>
                        </div>
                    )}
                </div>

                <div className="mt-6 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
                    <div className="space-y-3">
                        {loading ? (
                            <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-10 text-center text-sm text-slate-400">
                                Yukleniyor...
                            </div>
                        ) : filteredDocuments.length === 0 ? (
                            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
                                Henuz dokuman yok.
                            </div>
                        ) : (
                            filteredDocuments.map((doc) => (
                                <div
                                    key={doc.id}
                                    className="group flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-white/80 px-4 py-3 transition hover:border-slate-300"
                                >
                                    <div>
                                        <p className="text-sm font-semibold text-slate-900">{doc.title}</p>
                                        <p className="text-xs text-slate-500">
                                            {doc.policyNo ? `Police ${doc.policyNo}` : doc.employeeName || 'Kurumsal dokuman'}
                                        </p>
                                        <p className="text-[11px] text-slate-400">
                                            {new Date(doc.createdAt).toLocaleDateString('tr-TR')} • {doc.fileName}
                                            {doc.size ? ` • ${Math.round(doc.size / 1024)} KB` : ''}
                                        </p>
                                        {getSecondaryChips(doc).length > 0 && (
                                            <div className="mt-2 flex flex-wrap gap-2">
                                                {getSecondaryChips(doc).map((chip) => (
                                                    <button
                                                        key={chip.label}
                                                        type="button"
                                                        onClick={() => handleChipFilter(chip.label)}
                                                        className={`rounded-full px-2 py-1 text-[10px] font-semibold ${chip.tone} hover:opacity-80`}
                                                    >
                                                        {chip.label}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[10px] font-semibold ${formatKindBadge(doc)}`}>
                                            <i className={getBadgeLabel(doc).icon}></i>
                                            {getBadgeLabel(doc).label}
                                        </span>
                                        <div className="flex items-center gap-2 opacity-0 transition group-hover:opacity-100">
                                            <a
                                                href={doc.fileUrl}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700"
                                                title="Indir"
                                            >
                                                <i className="pi pi-download text-xs"></i>
                                            </a>
                                            <button
                                                type="button"
                                                onClick={() => handleCopyLink(doc.fileUrl)}
                                                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700"
                                                title="Baglantiyi kopyala"
                                            >
                                                <i className="pi pi-copy text-xs"></i>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 text-xs text-slate-500">
                            <span>
                                {total === 0 ? 0 : (page - 1) * limit + 1}-{Math.min(page * limit, total)} / {total}
                            </span>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                                    disabled={page <= 1}
                                    className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 hover:border-slate-300 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    Onceki
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                                    disabled={page >= totalPages}
                                    className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 hover:border-slate-300 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    Sonraki
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Dokuman yukle</p>
                        <h4 className="mt-2 text-sm font-semibold text-slate-900">Yeni belge ekle</h4>
                        <div className="mt-4 space-y-3 text-sm text-slate-600">
                            <div className="flex flex-col gap-2">
                                <label className="text-xs font-semibold text-slate-500">Tur</label>
                                <select
                                    value={uploadKind}
                                    onChange={(event) => setUploadKind(event.target.value as 'policy' | 'employee')}
                                    className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm"
                                >
                                    <option value="policy">Police</option>
                                    <option value="employee">Calisan</option>
                                </select>
                            </div>
                            {uploadKind === 'policy' && (
                                <div className="flex flex-col gap-2">
                                    <label className="text-xs font-semibold text-slate-500">Dokuman tipi</label>
                                    <select
                                        value={uploadType}
                                        onChange={(event) => setUploadType(event.target.value)}
                                        className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm"
                                    >
                                        <option value="POLICY_PDF">Police PDF</option>
                                        <option value="RECEIPT">Fatura</option>
                                        <option value="ENDORSEMENT">Zeyil</option>
                                        <option value="CONTRACT">Sozlesme</option>
                                    </select>
                                </div>
                            )}
                            <div className="flex flex-col gap-2">
                                <label className="text-xs font-semibold text-slate-500">Baglanti</label>
                                <select
                                    value={uploadTargetId}
                                    onChange={(event) => setUploadTargetId(event.target.value)}
                                    className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm"
                                >
                                    <option value="">Seciniz</option>
                                    {targets.map((target) => (
                                        <option key={target.value} value={target.value}>{target.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-xs font-semibold text-slate-500">Dosya</label>
                                <Input
                                    id="document-file"
                                    type="file"
                                    onChange={(event) => setFile(event.target.files?.[0] || null)}
                                />
                            </div>
                            <Button
                                className="h-11 bg-emerald-600 hover:bg-emerald-700 text-white"
                                loading={uploading}
                                onClick={handleUpload}
                                disabled={!file || !uploadTargetId}
                            >
                                Yukle
                            </Button>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}

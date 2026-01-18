'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/atoms/Button';
import { Input } from '@/components/atoms/Input';
import { api } from '../../../lib/api';
import { useToast } from '@/components/ui/use-toast';

type PackageItem = {
    id: string;
    name: string;
    tier: string;
    priceRange: string;
    focus: string;
    highlights?: string[];
    carriers?: { id: string; name: string }[];
    minEmployees?: number | null;
    isActive?: boolean;
};

type WizardStep = 1 | 2 | 3 | 4;

export default function InsurancePackagesPage() {
    const { toast } = useToast();
    const [packages, setPackages] = useState<PackageItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [step, setStep] = useState<WizardStep>(1);
    const [saving, setSaving] = useState(false);
    const [carriers, setCarriers] = useState<any[]>([]);
    const [loadingCarriers, setLoadingCarriers] = useState(true);

    const [name, setName] = useState('');
    const [tier, setTier] = useState('');
    const [priceRange, setPriceRange] = useState('');
    const [focus, setFocus] = useState('');
    const [minEmployees, setMinEmployees] = useState('');
    const [highlights, setHighlights] = useState('');
    const [isActive, setIsActive] = useState(true);
    const [carrierIds, setCarrierIds] = useState<string[]>([]);

    const fetchData = () => {
        setLoading(true);
        api.get('/packages', { params: { includeInactive: true } })
            .then((res) => {
                setPackages(res.data || []);
            })
            .catch((err) => console.error(err))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        let cancelled = false;
        const fetchCarriers = async () => {
            setLoadingCarriers(true);
            try {
                const res = await api.get('/carriers', { params: { includeInactive: false } });
                if (!cancelled) {
                    setCarriers(res.data || []);
                }
            } catch (error) {
                console.error(error);
            } finally {
                if (!cancelled) setLoadingCarriers(false);
            }
        };
        fetchCarriers();
        return () => {
            cancelled = true;
        };
    }, []);

    const selectedPackage = useMemo(
        () => packages.find((item) => item.id === selectedId) || null,
        [packages, selectedId]
    );

    const resetForm = () => {
        setSelectedId(null);
        setStep(1);
        setName('');
        setTier('');
        setPriceRange('');
        setFocus('');
        setMinEmployees('');
        setHighlights('');
        setIsActive(true);
        setCarrierIds([]);
    };

    const hydrateForm = (item: PackageItem) => {
        setName(item.name || '');
        setTier(item.tier || '');
        setPriceRange(item.priceRange || '');
        setFocus(item.focus || '');
        setMinEmployees(item.minEmployees ? String(item.minEmployees) : '');
        setHighlights((item.highlights || []).join('\n'));
        setIsActive(item.isActive !== false);
        setCarrierIds((item.carriers || []).map((carrier: any) => carrier.id));
    };

    const handleSelect = (item: PackageItem) => {
        setSelectedId(item.id);
        hydrateForm(item);
        setStep(1);
    };

    const parseHighlights = (value: string) =>
        String(value || '')
            .split(/\n|,/)
            .map((item) => item.trim())
            .filter(Boolean);

    const handleSave = async () => {
        const payload = {
            name,
            tier,
            priceRange,
            focus,
            minEmployees: minEmployees ? Number(minEmployees) : undefined,
            isActive,
            highlights: parseHighlights(highlights),
            carrierIds,
        };
        setSaving(true);
        try {
            if (selectedId) {
                await api.patch(`/packages/${selectedId}`, payload);
            } else {
                await api.post('/packages', payload);
            }
            toast({ title: 'Kaydedildi', description: 'Paket bilgileri guncellendi.' });
            fetchData();
        } catch (error) {
            console.error(error);
            toast({ title: 'Kayit hatasi', description: 'Lutfen bilgileri kontrol edin.' });
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!selectedId) return;
        const confirm = window.confirm('Secili paketi silmek istiyor musunuz?');
        if (!confirm) return;
        try {
            await api.delete(`/packages/${selectedId}`);
            toast({ title: 'Silindi', description: 'Paket kaldirildi.' });
            resetForm();
            fetchData();
        } catch (error) {
            console.error(error);
            toast({ title: 'Silme hatasi', description: 'Daha sonra tekrar deneyin.' });
        }
    };

    return (
        <div className="flex flex-col gap-6 pb-10">
            <section className="rounded-[28px] bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 p-6 sm:p-8 text-white shadow-2xl shadow-slate-900/40">
                <div className="flex flex-col gap-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.4em] text-emerald-200">Paket mimarisi</p>
                    <h2 className="text-3xl font-semibold leading-tight">Sigorta paketleri tasarimi</h2>
                    <p className="max-w-3xl text-sm text-white/70">
                        Kurumsal paket kurgusunu adim adim olusturun. Teklif detaylarini ve one cikanlari burada yonetin.
                    </p>
                </div>
            </section>

            <section className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
                <div className="app-card rounded-[24px] border border-slate-100/70 p-5 sm:p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Paket listesi</p>
                            <h3 className="text-lg font-semibold text-slate-900">Yayinlanan ve taslaklar</h3>
                        </div>
                        <Button variant="outline" onClick={resetForm}>Yeni paket</Button>
                    </div>
                    <div className="mt-4 space-y-3">
                        {loading ? (
                            <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-10 text-center text-sm text-slate-400">
                                Yukleniyor...
                            </div>
                        ) : packages.length === 0 ? (
                            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
                                Henuz paket bulunmuyor.
                            </div>
                        ) : (
                            packages.map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => handleSelect(item)}
                                    className={`flex w-full flex-wrap items-center justify-between gap-3 rounded-2xl border px-4 py-4 text-left transition hover:border-slate-300 ${selectedId === item.id ? 'border-emerald-400 bg-emerald-50/40' : 'border-slate-100 bg-white/80'}`}
                                >
                                    <div>
                                        <p className="text-sm font-semibold text-slate-900">{item.name}</p>
                                        <p className="text-xs text-slate-500">{item.tier} • {item.priceRange}</p>
                                        <p className="text-xs text-slate-400">{item.focus}</p>
                                        <p className="text-[11px] text-slate-400">
                                            {item.carriers?.length ? `${item.carriers.length} marka` : 'Marka secilmedi'}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge variant={item.isActive ? 'success' : 'secondary'}>
                                            {item.isActive ? 'Aktif' : 'Pasif'}
                                        </Badge>
                                        <span className="text-xs text-slate-400">
                                            {item.minEmployees ? `${item.minEmployees}+ calisan` : 'Kurumsal'}
                                        </span>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>

                <div className="app-card rounded-[24px] border border-slate-100/70 p-5 sm:p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Paket tasarimi</p>
                            <h3 className="text-lg font-semibold text-slate-900">Kurgu adimlari</h3>
                        </div>
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">Adim {step}/4</span>
                    </div>

                    <div className="mt-5 grid grid-cols-4 gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                        {[1, 2, 3, 4].map((item) => (
                            <button
                                key={item}
                                onClick={() => setStep(item as WizardStep)}
                                className={`rounded-full border px-3 py-2 text-center transition ${step === item ? 'border-emerald-400 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-white text-slate-400'}`}
                            >
                                {item === 1 && 'Temel'}
                                {item === 2 && 'Fiyat'}
                                {item === 3 && 'Marka'}
                                {item === 4 && 'Sunum'}
                            </button>
                        ))}
                    </div>

                    {step === 1 && (
                        <div className="mt-6 grid gap-4">
                            <Input
                                id="package-name"
                                label="Paket adi"
                                placeholder="Kurumsal Gold"
                                value={name}
                                onChange={(event) => setName(event.target.value)}
                            />
                            <Input
                                id="package-tier"
                                label="Seviye"
                                placeholder="Gold / Platinum"
                                value={tier}
                                onChange={(event) => setTier(event.target.value)}
                            />
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-medium text-slate-700">Odak aciklamasi</label>
                                <textarea
                                    value={focus}
                                    onChange={(event) => setFocus(event.target.value)}
                                    className="min-h-[120px] rounded-md border border-slate-200 bg-white px-3 py-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                                    placeholder="Paketin ana faydasini tek cumlede anlatin."
                                />
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="mt-6 grid gap-4">
                            <Input
                                id="package-price"
                                label="Fiyat bandi"
                                placeholder="20.000 - 35.000 TRY"
                                value={priceRange}
                                onChange={(event) => setPriceRange(event.target.value)}
                            />
                            <Input
                                id="package-min"
                                label="Minimum calisan"
                                placeholder="50"
                                value={minEmployees}
                                onChange={(event) => setMinEmployees(event.target.value)}
                            />
                            <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-xs text-slate-500">
                                Fiyat bandi, teklif formunda gorunen araligi ifade eder.
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="mt-6 grid gap-4">
                            <div>
                                <p className="text-sm font-semibold text-slate-700">Sigorta markalari</p>
                                <p className="mt-1 text-xs text-slate-500">Pakete uygun markalari secin. Secilenler basvuru ekraninda gorunecek.</p>
                            </div>
                            {loadingCarriers ? (
                                <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-6 text-center text-xs text-slate-500">
                                    Markalar yukleniyor...
                                </div>
                            ) : carriers.length === 0 ? (
                                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-xs text-slate-500">
                                    Aktif sigorta markasi bulunmuyor.
                                </div>
                            ) : (
                                <div className="grid gap-3 sm:grid-cols-2">
                                    {carriers.map((carrier: any) => {
                                        const selected = carrierIds.includes(carrier.id);
                                        return (
                                            <button
                                                key={carrier.id}
                                                type="button"
                                                onClick={() => {
                                                    setCarrierIds((prev) =>
                                                        prev.includes(carrier.id)
                                                            ? prev.filter((id) => id !== carrier.id)
                                                            : [...prev, carrier.id]
                                                    );
                                                }}
                                                className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-left transition ${selected ? 'border-emerald-400 bg-emerald-50/40' : 'border-slate-100 bg-white/80 hover:border-slate-300'}`}
                                            >
                                                <div>
                                                    <p className="text-sm font-semibold text-slate-900">{carrier.name}</p>
                                                    <p className="text-xs text-slate-500">{carrier.code}</p>
                                                </div>
                                                <span className={`text-[10px] font-semibold ${selected ? 'text-emerald-600' : 'text-slate-400'}`}>
                                                    {selected ? 'Secildi' : 'Sec'}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    {step === 4 && (
                        <div className="mt-6 grid gap-4">
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-medium text-slate-700">One cikanlar</label>
                                <textarea
                                    value={highlights}
                                    onChange={(event) => setHighlights(event.target.value)}
                                    className="min-h-[140px] rounded-md border border-slate-200 bg-white px-3 py-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                                    placeholder="Her satira bir madde ekleyin."
                                />
                            </div>
                            <label className="flex items-center gap-2 text-sm text-slate-700">
                                <input
                                    type="checkbox"
                                    checked={isActive}
                                    onChange={(event) => setIsActive(event.target.checked)}
                                />
                                Paketi yayina al
                            </label>
                        </div>
                    )}

                    <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                            <Button variant="outline" onClick={() => setStep((prev) => (prev > 1 ? (prev - 1) as WizardStep : prev))}>
                                Geri
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => setStep((prev) => (prev < 4 ? (prev + 1) as WizardStep : prev))}
                            >
                                Ileri
                            </Button>
                        </div>
                        <div className="flex items-center gap-2">
                            {selectedId && (
                                <Button variant="outline" onClick={handleDelete}>
                                    Sil
                                </Button>
                            )}
                            <Button onClick={handleSave} loading={saving}>
                                {selectedId ? 'Guncelle' : 'Paket olustur'}
                            </Button>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}

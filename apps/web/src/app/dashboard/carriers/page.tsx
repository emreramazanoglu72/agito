'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/atoms/Button';
import { Input } from '@/components/atoms/Input';
import { Badge } from '@/components/ui/badge';
import { api } from '../../../lib/api';
import { useToast } from '@/components/ui/use-toast';

export default function CarriersPage() {
    const { toast } = useToast();
    const [carriers, setCarriers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [name, setName] = useState('');
    const [code, setCode] = useState('');
    const [logoUrl, setLogoUrl] = useState('');
    const [isActive, setIsActive] = useState(true);
    const [saving, setSaving] = useState(false);

    const fetchCarriers = async () => {
        setLoading(true);
        try {
            const res = await api.get('/carriers', { params: { includeInactive: true } });
            setCarriers(res.data || []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCarriers();
    }, []);

    const selectedCarrier = useMemo(
        () => carriers.find((item) => item.id === selectedId) || null,
        [carriers, selectedId]
    );

    const resetForm = () => {
        setSelectedId(null);
        setName('');
        setCode('');
        setLogoUrl('');
        setIsActive(true);
    };

    const hydrate = (item: any) => {
        setName(item.name || '');
        setCode(item.code || '');
        setLogoUrl(item.logoUrl || '');
        setIsActive(item.isActive !== false);
    };

    const handleSelect = (item: any) => {
        setSelectedId(item.id);
        hydrate(item);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const payload = { name, code, logoUrl: logoUrl || undefined, isActive };
            if (selectedId) {
                await api.patch(`/carriers/${selectedId}`, payload);
            } else {
                await api.post('/carriers', payload);
            }
            toast({ title: 'Kaydedildi', description: 'Sigorta markasi guncellendi.' });
            fetchCarriers();
        } catch (error) {
            console.error(error);
            toast({ title: 'Kayit hatasi', description: 'Bilgileri kontrol edin.' });
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!selectedId) return;
        const confirm = window.confirm('Markayi silmek istiyor musunuz?');
        if (!confirm) return;
        try {
            await api.delete(`/carriers/${selectedId}`);
            toast({ title: 'Silindi', description: 'Marka kaldirildi.' });
            resetForm();
            fetchCarriers();
        } catch (error) {
            console.error(error);
            toast({ title: 'Silme hatasi', description: 'Paket baglantisi olabilir.' });
        }
    };

    return (
        <div className="flex flex-col gap-6 pb-10">
            <section className="rounded-[28px] bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 p-6 sm:p-8 text-white shadow-2xl shadow-slate-900/40">
                <div className="flex flex-col gap-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.4em] text-emerald-200">Marka yonetimi</p>
                    <h2 className="text-3xl font-semibold leading-tight">Sigorta markalari</h2>
                    <p className="max-w-3xl text-sm text-white/70">
                        Anlasmali sigorta markalarini olusturun ve paketlerle eslestirin.
                    </p>
                </div>
            </section>

            <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
                <div className="app-card rounded-[24px] border border-slate-100/70 p-5 sm:p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Markalar</p>
                            <h3 className="text-lg font-semibold text-slate-900">Portfoy listesi</h3>
                        </div>
                        <Button variant="outline" onClick={resetForm}>Yeni marka</Button>
                    </div>
                    <div className="mt-4 space-y-3">
                        {loading ? (
                            <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-10 text-center text-sm text-slate-400">
                                Yukleniyor...
                            </div>
                        ) : carriers.length === 0 ? (
                            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
                                Henuz marka bulunmuyor.
                            </div>
                        ) : (
                            carriers.map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => handleSelect(item)}
                                    className={`flex w-full items-center justify-between gap-3 rounded-2xl border px-4 py-4 text-left transition hover:border-slate-300 ${selectedId === item.id ? 'border-emerald-400 bg-emerald-50/40' : 'border-slate-100 bg-white/80'}`}
                                >
                                    <div>
                                        <p className="text-sm font-semibold text-slate-900">{item.name}</p>
                                        <p className="text-xs text-slate-500">Kod: {item.code}</p>
                                    </div>
                                    <Badge variant={item.isActive ? 'success' : 'secondary'}>{item.isActive ? 'Aktif' : 'Pasif'}</Badge>
                                </button>
                            ))
                        )}
                    </div>
                </div>

                <div className="app-card rounded-[24px] border border-slate-100/70 p-5 sm:p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Detaylar</p>
                            <h3 className="text-lg font-semibold text-slate-900">Marka bilgisi</h3>
                        </div>
                        {selectedCarrier && (
                            <Badge variant={selectedCarrier.isActive ? 'success' : 'secondary'}>
                                {selectedCarrier.isActive ? 'Aktif' : 'Pasif'}
                            </Badge>
                        )}
                    </div>
                    <div className="mt-6 grid gap-4">
                        <Input
                            id="carrier-name"
                            label="Marka adi"
                            value={name}
                            onChange={(event) => setName(event.target.value)}
                        />
                        <Input
                            id="carrier-code"
                            label="Marka kodu"
                            value={code}
                            onChange={(event) => setCode(event.target.value)}
                        />
                        <Input
                            id="carrier-logo"
                            label="Logo URL"
                            value={logoUrl}
                            onChange={(event) => setLogoUrl(event.target.value)}
                        />
                        <label className="flex items-center gap-2 text-sm text-slate-700">
                            <input type="checkbox" checked={isActive} onChange={(event) => setIsActive(event.target.checked)} />
                            Markayi yayina al
                        </label>
                    </div>
                    <div className="mt-6 flex items-center justify-between">
                        {selectedId ? (
                            <Button variant="outline" onClick={handleDelete}>Sil</Button>
                        ) : (
                            <span className="text-xs text-slate-400">Yeni marka olusturuluyor</span>
                        )}
                        <Button onClick={handleSave} loading={saving}>Kaydet</Button>
                    </div>
                </div>
            </section>
        </div>
    );
}

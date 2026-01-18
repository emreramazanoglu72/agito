'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '../../../../../components/atoms/Input';
import { Button } from '../../../../../components/atoms/Button';
import { api } from '../../../../../lib/api';
import { useToast } from '@/components/ui/use-toast';

type PackageItem = {
    id: string;
    name: string;
    tier: string;
    priceRange: string;
    focus: string;
    highlights: string[];
    minEmployees?: number | null;
    carriers?: { id: string; name: string; code: string }[];
};

type WizardStep = 'package' | 'carrier' | 'company' | 'employees' | 'documents' | 'summary';

export default function NewApplicationPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [step, setStep] = useState<WizardStep>('package');
    const [packages, setPackages] = useState<PackageItem[]>([]);
    const [loadingPackages, setLoadingPackages] = useState(true);
    const [selectedPackage, setSelectedPackage] = useState<PackageItem | null>(null);
    const [selectedCarrierId, setSelectedCarrierId] = useState<string>('');

    const [companyName, setCompanyName] = useState('');
    const [companyEmail, setCompanyEmail] = useState('');
    const [companyPhone, setCompanyPhone] = useState('');
    const [employeeCount, setEmployeeCount] = useState('');
    const [employeeList, setEmployeeList] = useState<string>('');
    const [documents, setDocuments] = useState<File[]>([]);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        let cancelled = false;
        const fetchPackages = async () => {
            setLoadingPackages(true);
            try {
                const res = await api.get('/packages', { params: { includeInactive: false } });
                if (!cancelled) {
                    setPackages(res.data || []);
                }
            } catch (error) {
                console.error(error);
            } finally {
                if (!cancelled) {
                    setLoadingPackages(false);
                }
            }
        };
        fetchPackages();
        return () => {
            cancelled = true;
        };
    }, []);

    const stepIndex = ['package', 'carrier', 'company', 'employees', 'documents', 'summary'].indexOf(step) + 1;

    const nextStep = () => {
        const order: WizardStep[] = ['package', 'carrier', 'company', 'employees', 'documents', 'summary'];
        const currentIndex = order.indexOf(step);
        setStep(order[Math.min(order.length - 1, currentIndex + 1)]);
    };

    const prevStep = () => {
        const order: WizardStep[] = ['package', 'carrier', 'company', 'employees', 'documents', 'summary'];
        const currentIndex = order.indexOf(step);
        setStep(order[Math.max(0, currentIndex - 1)]);
    };

    const totalEmployees = useMemo(() => {
        if (!employeeList) return 0;
        return employeeList
            .split('\n')
            .map((line) => line.trim())
            .filter(Boolean).length;
    }, [employeeList]);

    const handleSubmit = async () => {
        if (!selectedPackage) return;
        setSubmitting(true);
        try {
            const payload = {
                packageId: selectedPackage.id,
                companyName,
                companyEmail,
                companyPhone,
                employeeCount: Number(employeeCount || totalEmployees),
                employeeList: employeeList
                    .split('\n')
                    .map((line) => line.trim())
                    .filter(Boolean),
                hasDocuments: documents.length > 0,
                carrierId: selectedCarrierId || undefined,
            };
            const response = await api.post('/applications', payload);
            const applicationId = response?.data?.id;
            if (applicationId && documents.length > 0) {
                await Promise.all(
                    documents.map((file) => {
                        const formData = new FormData();
                        formData.append('file', file);
                        return api.post(`/applications/${applicationId}/documents`, formData, {
                            headers: { 'Content-Type': 'multipart/form-data' },
                        });
                    })
                );
            }
            toast({ title: 'Basvuru alindi', description: 'Talebiniz incelemeye alindi.' });
            router.push('/customer/applications');
        } catch (error) {
            console.error(error);
            toast({ title: 'Basvuru basarisiz', description: 'Bilgileri kontrol edin.' });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="flex flex-col gap-6 pb-10">
            <section className="rounded-[28px] bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 p-6 sm:p-8 text-white shadow-2xl shadow-slate-900/40">
                <div className="flex flex-col gap-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.4em] text-emerald-200">Basvuru wizard</p>
                    <h2 className="text-3xl font-semibold leading-tight">Kurumsal police basvurusu</h2>
                    <p className="max-w-3xl text-sm text-white/70">
                        Paket secin, ekip listenizi ekleyin ve basvurunuzu gonderin. Admin onayindan sonra policeniz aktiflesir.
                    </p>
                </div>
                <div className="mt-6 flex flex-wrap items-center gap-3 text-xs font-semibold text-white/80">
                    <span className="rounded-full border border-white/20 px-3 py-1">Adim {stepIndex} / 6</span>
                    <span className="rounded-full border border-white/20 px-3 py-1">Durum: Taslak</span>
                </div>
            </section>

            <section className="app-card rounded-[24px] border border-slate-100/70 p-5 sm:p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Basvuru adimi</p>
                        <h3 className="text-lg font-semibold text-slate-900">
                            {step === 'package' && 'Paket secimi'}
                            {step === 'carrier' && 'Sigorta markasi'}
                            {step === 'company' && 'Sirket bilgileri'}
                            {step === 'employees' && 'Calisan listesi'}
                            {step === 'documents' && 'Dokuman yukleme'}
                            {step === 'summary' && 'Ozet ve gonder'}
                        </h3>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" onClick={prevStep} disabled={stepIndex === 1}>Geri</Button>
                        {step !== 'summary' ? (
                            <Button onClick={nextStep}>Devam et</Button>
                        ) : (
                            <Button onClick={handleSubmit} loading={submitting}>Basvuruyu gonder</Button>
                        )}
                    </div>
                </div>

                {step === 'package' && (
                    <div className="mt-6 grid gap-4 lg:grid-cols-3">
                        {loadingPackages ? (
                            <div className="col-span-full rounded-2xl border border-slate-100 bg-slate-50 px-4 py-10 text-center text-sm text-slate-400">
                                Paketler yukleniyor...
                            </div>
                        ) : packages.length === 0 ? (
                            <div className="col-span-full rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
                                Yayinlanan paket bulunmuyor.
                            </div>
                        ) : (
                            packages.map((pkg) => (
                                <button
                                    key={pkg.id}
                                    onClick={() => {
                                        setSelectedPackage(pkg);
                                        setSelectedCarrierId('');
                                    }}
                                    className={`rounded-3xl border p-5 text-left transition hover:-translate-y-1 hover:shadow-lg ${selectedPackage?.id === pkg.id ? 'border-emerald-500 bg-emerald-50/40' : 'border-slate-100 bg-white'}`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">{pkg.tier}</p>
                                            <h4 className="mt-2 text-lg font-bold text-slate-900">{pkg.name}</h4>
                                        </div>
                                        <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-semibold text-slate-600">
                                            {pkg.minEmployees ? `${pkg.minEmployees}+ calisan` : 'Kurumsal'}
                                        </span>
                                    </div>
                                    <p className="mt-3 text-sm text-slate-600">{pkg.focus}</p>
                                    <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Fiyat bandi</p>
                                        <p className="mt-1 text-sm font-semibold text-slate-900">{pkg.priceRange}</p>
                                    </div>
                                    <ul className="mt-4 space-y-2 text-xs text-slate-600">
                                        {(pkg.highlights || []).map((item) => (
                                            <li key={item} className="flex items-center gap-2">
                                                <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
                                                {item}
                                            </li>
                                        ))}
                                    </ul>
                                </button>
                            ))
                        )}
                    </div>
                )}

                {step === 'carrier' && (
                    <div className="mt-6 grid gap-4">
                        <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4">
                            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Sigorta markasi</p>
                            <p className="mt-3 text-sm text-slate-600">
                                Basvurunun baglanacagi markayi secin. Bu liste pakete uygun markalardan olusur.
                            </p>
                        </div>
                        <div className="grid gap-3 md:grid-cols-2">
                            {(selectedPackage?.carriers || []).length === 0 ? (
                                <div className="col-span-full rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-xs text-slate-500">
                                    Bu paket icin marka tanimi bulunmuyor.
                                </div>
                            ) : (
                                selectedPackage?.carriers?.map((carrier) => (
                                    <button
                                        key={carrier.id}
                                        type="button"
                                        onClick={() => setSelectedCarrierId(carrier.id)}
                                        className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-left transition ${selectedCarrierId === carrier.id ? 'border-emerald-400 bg-emerald-50/40' : 'border-slate-100 bg-white/80 hover:border-slate-300'}`}
                                    >
                                        <div>
                                            <p className="text-sm font-semibold text-slate-900">{carrier.name}</p>
                                            <p className="text-xs text-slate-500">{carrier.code}</p>
                                        </div>
                                        <span className="text-[10px] font-semibold text-slate-400">
                                            {selectedCarrierId === carrier.id ? 'Secildi' : 'Sec'}
                                        </span>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {step === 'company' && (
                    <div className="mt-6 grid gap-4 md:grid-cols-2">
                        <Input
                            id="companyName"
                            label="Sirket adi"
                            placeholder="Ornek Sigorta A.S."
                            value={companyName}
                            onChange={(event) => setCompanyName(event.target.value)}
                        />
                        <Input
                            id="companyEmail"
                            label="Kurumsal e-posta"
                            placeholder="info@sirket.com"
                            value={companyEmail}
                            onChange={(event) => setCompanyEmail(event.target.value)}
                        />
                        <Input
                            id="companyPhone"
                            label="Telefon"
                            placeholder="05xx xxx xx xx"
                            value={companyPhone}
                            onChange={(event) => setCompanyPhone(event.target.value)}
                        />
                        <Input
                            id="employeeCount"
                            label="Calisan sayisi"
                            placeholder="Ornek: 120"
                            value={employeeCount}
                            onChange={(event) => setEmployeeCount(event.target.value)}
                        />
                    </div>
                )}

                {step === 'employees' && (
                    <div className="mt-6 grid gap-4">
                        <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                            Her satira bir calisan adi yazin. Toplam: {totalEmployees} kisi.
                        </div>
                        <textarea
                            value={employeeList}
                            onChange={(event) => setEmployeeList(event.target.value)}
                            placeholder="Ornek: Ad Soyad"
                            className="min-h-[200px] rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm"
                        />
                    </div>
                )}

                {step === 'documents' && (
                    <div className="mt-6 grid gap-4 md:grid-cols-2">
                        <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4">
                            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Dokuman plani</p>
                            <p className="mt-3 text-sm text-slate-600">
                                Admin ekibi talebinizden sonra gerekli belgeleri bildirecek. Asagidan dosyalarinizi ekleyebilirsiniz.
                            </p>
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-medium text-slate-700">Dokuman yukle</label>
                            <Input
                                id="document-upload"
                                type="file"
                                multiple
                                onChange={(event) => setDocuments(Array.from(event.target.files || []))}
                            />
                            {documents.length > 0 && (
                                <div className="rounded-2xl border border-slate-100 bg-white px-3 py-2 text-xs text-slate-600">
                                    {documents.length} dosya secildi.
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {step === 'summary' && (
                    <div className="mt-6 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
                        <div className="space-y-3">
                            <div className="rounded-2xl border border-slate-100 bg-white px-4 py-4">
                                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Secilen paket</p>
                                <p className="mt-2 text-sm font-semibold text-slate-900">{selectedPackage?.name || '-'}</p>
                                <p className="text-xs text-slate-500">{selectedPackage?.priceRange}</p>
                            </div>
                            <div className="rounded-2xl border border-slate-100 bg-white px-4 py-4">
                                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Sirket bilgileri</p>
                                <p className="mt-2 text-sm text-slate-900">{companyName || '-'} • {companyEmail || '-'}</p>
                                <p className="text-xs text-slate-500">{companyPhone || '-'} • {employeeCount || totalEmployees} calisan</p>
                            </div>
                            <div className="rounded-2xl border border-slate-100 bg-white px-4 py-4">
                                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Sigorta markasi</p>
                                <p className="mt-2 text-sm font-semibold text-slate-900">
                                    {selectedPackage?.carriers?.find((carrier) => carrier.id === selectedCarrierId)?.name || '-'}
                                </p>
                            </div>
                        </div>
                        <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4">
                            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Kontrol listesi</p>
                            <ul className="mt-3 space-y-2 text-xs text-slate-600">
                                <li className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-emerald-400"></span>Paket secildi</li>
                                <li className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-emerald-400"></span>Marka secildi</li>
                                <li className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-emerald-400"></span>Sirket bilgileri girildi</li>
                                <li className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-emerald-400"></span>Calisan listesi eklendi</li>
                                <li className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-emerald-400"></span>Dokuman yukleme {documents.length > 0 ? 'tamam' : 'bekliyor'}</li>
                            </ul>
                        </div>
                    </div>
                )}
            </section>
        </div>
    );
}

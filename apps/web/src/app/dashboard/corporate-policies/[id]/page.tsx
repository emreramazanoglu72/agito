'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/atoms/Button';
import { Input } from '@/components/atoms/Input';
import { api } from '../../../../lib/api';
import { useToast } from '@/components/ui/use-toast';

const statusLabels: Record<string, string> = {
    PENDING: 'Onay bekliyor',
    ACTIVE: 'Aktif',
    CANCELLED: 'Iptal',
};

const statusVariant: Record<string, 'success' | 'warning' | 'danger' | 'secondary' | 'default'> = {
    PENDING: 'warning',
    ACTIVE: 'success',
    CANCELLED: 'danger',
};

export default function CorporatePolicyDetailPage() {
    const router = useRouter();
    const params = useParams();
    const { toast } = useToast();
    const [item, setItem] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState('PENDING');
    const [policyType, setPolicyType] = useState('TSS');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [saving, setSaving] = useState(false);
    const [employees, setEmployees] = useState<any[]>([]);
    const [employeeSearch, setEmployeeSearch] = useState('');
    const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([]);
    const [activationReport, setActivationReport] = useState<any | null>(null);

    const id = params?.id as string;

    const fetchItem = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/corporate-policies/${id}`);
            setItem(res.data);
            setStatus(res.data?.status || 'PENDING');
            setPolicyType(res.data?.policyType || 'TSS');
            setStartDate(res.data?.startDate ? new Date(res.data.startDate).toISOString().slice(0, 10) : '');
            setEndDate(res.data?.endDate ? new Date(res.data.endDate).toISOString().slice(0, 10) : '');
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (id) fetchItem();
    }, [id]);

    useEffect(() => {
        const fetchEmployees = async () => {
            const companyId = item?.companyId || item?.application?.companyId;
            if (!companyId) return;
            try {
                const res = await api.get('/employees', { params: { companyId, limit: 200, page: 1 } });
                setEmployees(res.data?.data ?? []);
            } catch (error) {
                console.error(error);
            }
        };
        fetchEmployees();
    }, [item?.companyId]);

    const handleSave = async () => {
        setSaving(true);
        try {
            await api.patch(`/corporate-policies/${id}`, { status, startDate, endDate });
            toast({ title: 'Guncellendi', description: 'Sozlesme bilgileri kaydedildi.' });
            fetchItem();
        } catch (error) {
            console.error(error);
            toast({ title: 'Kayit hatasi', description: 'Lutfen tekrar deneyin.' });
        } finally {
            setSaving(false);
        }
    };

    const handleActivate = async () => {
        if (!startDate || !endDate) {
            toast({ title: 'Tarih eksik', description: 'Baslangic ve bitis tarihini doldurun.' });
            return;
        }
        setSaving(true);
        try {
            const response = await api.post(`/corporate-policies/${id}/activate`, {
                policyType,
                startDate,
                endDate,
                employeeIds: selectedEmployeeIds.length ? selectedEmployeeIds : undefined,
            });
            setActivationReport(response.data?.report || null);
            toast({
                title: 'Policeler olusturuldu',
                description: `${response.data?.report?.createdCount || 0} poliçe olusturuldu.`,
            });
            fetchItem();
        } catch (error) {
            console.error(error);
            toast({ title: 'Islem basarisiz', description: 'Lutfen tekrar deneyin.' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="p-10 text-center text-slate-500">Yukleniyor...</div>;
    }

    if (!item) {
        return <div className="p-10 text-center text-slate-500">Sozlesme bulunamadi.</div>;
    }

    const filteredEmployees = employees.filter((employee) => {
        if (!employeeSearch.trim()) return true;
        const query = employeeSearch.toLowerCase();
        const fullName = `${employee.firstName || ''} ${employee.lastName || ''}`.trim().toLowerCase();
        return fullName.includes(query) || (employee.email || '').toLowerCase().includes(query);
    });

    const currencyFormatter = new Intl.NumberFormat('tr-TR', {
        style: 'currency',
        currency: 'TRY',
        maximumFractionDigits: 0,
    });

    return (
        <div className="flex flex-col gap-6 pb-10">
            <section className="rounded-[28px] bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 p-6 sm:p-8 text-white shadow-2xl shadow-slate-900/40">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.4em] text-emerald-200">Sozlesme detayi</p>
                        <h2 className="text-3xl font-semibold leading-tight">{item.companyName}</h2>
                        <p className="mt-2 text-sm text-white/70">{item.package?.name} • {item.carrier?.name || 'Marka yok'}</p>
                    </div>
                    <Badge variant={statusVariant[item.status] || 'secondary'}>
                        {statusLabels[item.status] || item.status}
                    </Badge>
                </div>
            </section>

            <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
                <div className="app-card rounded-[24px] border border-slate-100/70 p-5 sm:p-6 space-y-4">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Sozlesme bilgileri</p>
                        <h3 className="text-lg font-semibold text-slate-900">Temel detaylar</h3>
                    </div>
                    <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                        <p className="text-xs text-slate-500">Basvuru</p>
                        <p className="text-sm font-semibold text-slate-900">{item.application?.companyName}</p>
                        <p className="text-xs text-slate-500">{new Date(item.application?.createdAt).toLocaleDateString('tr-TR')}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                        <p className="text-xs text-slate-500">Paket</p>
                        <p className="text-sm font-semibold text-slate-900">{item.package?.name}</p>
                        <p className="text-xs text-slate-500">{item.package?.priceRange}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                        <p className="text-xs text-slate-500">Marka</p>
                        <p className="text-sm font-semibold text-slate-900">{item.carrier?.name || '-'}</p>
                        <p className="text-xs text-slate-500">{item.carrier?.code || ''}</p>
                    </div>
                </div>

                <div className="app-card rounded-[24px] border border-slate-100/70 p-5 sm:p-6 space-y-4">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Yonetim</p>
                        <h3 className="text-lg font-semibold text-slate-900">Durum & tarih</h3>
                    </div>
                    <div>
                        <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Durum</label>
                        <select
                            value={status}
                            onChange={(event) => setStatus(event.target.value)}
                            className="mt-2 h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
                        >
                            <option value="PENDING">Onay bekliyor</option>
                            <option value="ACTIVE">Aktif</option>
                            <option value="CANCELLED">Iptal</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Poliçe tipi</label>
                        <select
                            value={policyType}
                            onChange={(event) => setPolicyType(event.target.value)}
                            className="mt-2 h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
                        >
                            <option value="TSS">TSS</option>
                            <option value="OSS">OSS</option>
                            <option value="LIFE">LIFE</option>
                            <option value="FERDI_KAZA">FERDI_KAZA</option>
                        </select>
                    </div>
                    <Input
                        id="startDate"
                        label="Baslangic"
                        type="date"
                        value={startDate}
                        onChange={(event) => setStartDate(event.target.value)}
                    />
                    <Input
                        id="endDate"
                        label="Bitis"
                        type="date"
                        value={endDate}
                        onChange={(event) => setEndDate(event.target.value)}
                    />
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Calisan secimi</p>
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                            <Button
                                variant="outline"
                                onClick={() => setSelectedEmployeeIds(employees.map((employee) => employee.id))}
                                disabled={employees.length === 0}
                            >
                                Tumunu sec
                            </Button>
                            <Button variant="outline" onClick={() => setSelectedEmployeeIds([])}>
                                Temizle
                            </Button>
                        </div>
                        <Input
                            id="employee-search"
                            label="Arama"
                            placeholder="Calisan adi veya e-posta"
                            value={employeeSearch}
                            onChange={(event) => setEmployeeSearch(event.target.value)}
                        />
                        <div className="mt-3 max-h-56 space-y-2 overflow-y-auto rounded-2xl border border-slate-100 bg-white/80 px-3 py-2">
                            {filteredEmployees.length === 0 ? (
                                <div className="py-6 text-center text-xs text-slate-500">Calisan bulunamadi.</div>
                            ) : (
                                filteredEmployees.map((employee) => {
                                    const checked = selectedEmployeeIds.includes(employee.id);
                                    return (
                                        <label
                                            key={employee.id}
                                            className="flex items-center justify-between gap-2 rounded-xl px-2 py-2 text-sm text-slate-700 hover:bg-slate-50"
                                        >
                                            <span>
                                                {employee.firstName} {employee.lastName}
                                                <span className="block text-[11px] text-slate-400">{employee.email || '-'}</span>
                                            </span>
                                            <input
                                                type="checkbox"
                                                checked={checked}
                                                onChange={() => {
                                                    setSelectedEmployeeIds((prev) =>
                                                        prev.includes(employee.id)
                                                            ? prev.filter((id) => id !== employee.id)
                                                            : [...prev, employee.id]
                                                    );
                                                }}
                                            />
                                        </label>
                                    );
                                })
                            )}
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <Button onClick={handleSave} loading={saving}>Guncelle</Button>
                        <Button variant="outline" onClick={handleActivate} loading={saving}>Policeleri olustur</Button>
                    </div>
                    {activationReport && (
                        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                            {activationReport.createdCount} poliçe olusturuldu • {activationReport.employeeCount} calisan • {currencyFormatter.format(activationReport.totalPremium || 0)}
                        </div>
                    )}
                    <Button variant="outline" onClick={() => router.push('/dashboard/corporate-policies')}>Listeye don</Button>
                </div>
            </section>
        </div>
    );
}

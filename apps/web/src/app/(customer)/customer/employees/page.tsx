'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '../../../../components/atoms/Input';
import { Button } from '../../../../components/atoms/Button';
import { api } from '../../../../lib/api';
import { useDebounce } from '../../../../hooks/useDebounce';

export default function CustomerEmployeesPage() {
    const router = useRouter();
    const [employees, setEmployees] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [search, setSearch] = useState('');
    const pageSize = 8;

    const debouncedSearch = useDebounce(search, 400);

    useEffect(() => {
        let cancelled = false;
        const fetchEmployees = async () => {
            setLoading(true);
            try {
                const res = await api.get('/employees', {
                    params: { page, limit: pageSize, search: debouncedSearch || undefined },
                });
                if (!cancelled) {
                    setEmployees(res.data?.data ?? []);
                    setTotal(res.data?.total ?? 0);
                }
            } catch (error) {
                console.error(error);
            } finally {
                if (!cancelled) setLoading(false);
            }
        };
        fetchEmployees();
        return () => {
            cancelled = true;
        };
    }, [page, pageSize, debouncedSearch]);

    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    const formatDate = useMemo(() => (value?: string) => {
        if (!value) return '-';
        const date = new Date(value);
        return Number.isNaN(date.getTime()) ? '-' : date.toLocaleDateString('tr-TR');
    }, []);

    return (
        <div className="flex flex-col gap-6 pb-10">
            <section className="rounded-[28px] bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 p-6 sm:p-8 text-white shadow-2xl shadow-slate-900/40">
                <div className="flex flex-col gap-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.4em] text-emerald-200">Calisanlar</p>
                    <h2 className="text-3xl font-semibold leading-tight">Ekip listeniz</h2>
                    <p className="max-w-3xl text-sm text-white/70">
                        Kurumsal ekibinizdeki calisanlari ve policelerini izleyin.
                    </p>
                </div>
            </section>

            <section className="app-card rounded-[24px] border border-slate-100/70 p-5 sm:p-6">
                <div className="flex flex-wrap items-center gap-3">
                    <div className="min-w-[220px] flex-1">
                        <Input
                            id="employee-search"
                            label="Arama"
                            placeholder="Calisan adi veya e-posta"
                            value={search}
                            onChange={(event) => {
                                setSearch(event.target.value);
                                setPage(1);
                            }}
                        />
                    </div>
                </div>

                <div className="mt-6 space-y-3">
                    {loading ? (
                        <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-10 text-center text-sm text-slate-400">
                            Yukleniyor...
                        </div>
                    ) : employees.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
                            Calisan kaydi bulunmuyor.
                        </div>
                    ) : (
                        employees.map((employee) => (
                            <button
                                key={employee.id}
                                onClick={() => router.push(`/customer/employees/${employee.id}`)}
                                className="flex w-full flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-white/80 px-4 py-4 text-left transition hover:border-slate-300"
                            >
                                <div>
                                    <p className="text-sm font-semibold text-slate-900">{employee.firstName} {employee.lastName}</p>
                                    <p className="text-xs text-slate-500">{employee.email || '-'} • {employee.department?.name || 'Departman yok'}</p>
                                </div>
                                <div className="text-xs text-slate-400">Giris: {formatDate(employee.createdAt)}</div>
                            </button>
                        ))
                    )}
                </div>

                <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500">
                    <span>{total} kayit</span>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" onClick={() => setPage((prev) => Math.max(1, prev - 1))} disabled={page <= 1}>
                            Geri
                        </Button>
                        <span>{page} / {totalPages}</span>
                        <Button variant="outline" onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))} disabled={page >= totalPages}>
                            Ileri
                        </Button>
                    </div>
                </div>
            </section>
        </div>
    );
}

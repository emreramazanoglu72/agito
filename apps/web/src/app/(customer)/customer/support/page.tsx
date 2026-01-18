'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Input } from '../../../../components/atoms/Input';
import { Button } from '../../../../components/atoms/Button';
import { useToast } from '@/components/ui/use-toast';
import { api } from '../../../../lib/api';

export default function CustomerSupportPage() {
    const { toast } = useToast();
    const [subject, setSubject] = useState('');
    const [category, setCategory] = useState('operations');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [tickets, setTickets] = useState<any[]>([]);
    const [loadingTickets, setLoadingTickets] = useState(true);

    const statusStyles = useMemo(() => ({
        OPEN: 'bg-amber-100 text-amber-700',
        IN_PROGRESS: 'bg-sky-100 text-sky-700',
        RESOLVED: 'bg-emerald-100 text-emerald-700',
        CLOSED: 'bg-slate-100 text-slate-600'
    }), []);

    const fetchTickets = async () => {
        setLoadingTickets(true);
        try {
            const response = await api.get('/support/tickets', { params: { limit: 6 } });
            setTickets(response.data?.data ?? []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoadingTickets(false);
        }
    };

    useEffect(() => {
        fetchTickets();
    }, []);

    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault();
        setLoading(true);
        try {
            await api.post('/support/tickets', { subject, category, message });
            setSubject('');
            setMessage('');
            toast({
                title: 'Talebiniz alindi',
                description: 'Musteri basari ekibi en kisa surede sizinle iletisime gececek.'
            });
            fetchTickets();
        } catch (error) {
            console.error(error);
            toast({ title: 'Talep gonderilemedi', description: 'Lutfen tekrar deneyin.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col gap-6 pb-10">
            <section className="rounded-[28px] bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 p-6 sm:p-8 text-white shadow-2xl shadow-slate-900/40">
                <div className="flex flex-col gap-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.4em] text-emerald-200">Musteri destek</p>
                    <h2 className="text-3xl font-semibold leading-tight">Kurumsal destek ve onboarding</h2>
                    <p className="max-w-3xl text-sm text-white/70">
                        Ekip yonetimi, policeler ve tahsilat surecleri icin destek alin. Musteri basari ekibi size yol gostersin.
                    </p>
                </div>
            </section>

            <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
                <div className="app-card rounded-[24px] border border-slate-100/70 p-5 sm:p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Yeni talep</p>
                            <h3 className="text-lg font-semibold text-slate-900">Destek formu</h3>
                        </div>
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">Musteri basari</span>
                    </div>
                    <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                        <Input
                            id="subject"
                            label="Konu"
                            placeholder="Ornek: Yeni police onboarding"
                            value={subject}
                            onChange={(event) => setSubject(event.target.value)}
                            className="h-12 bg-gray-50 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500/20"
                        />
                        <div className="flex flex-col gap-2">
                            <label htmlFor="category" className="text-sm font-medium text-slate-700">Kategori</label>
                            <select
                                id="category"
                                value={category}
                                onChange={(event) => setCategory(event.target.value)}
                                className="h-12 rounded-md border border-gray-200 bg-gray-50 px-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                            >
                                <option value="operations">Operasyon</option>
                                <option value="policies">Policeler</option>
                                <option value="finance">Finans</option>
                                <option value="technical">Teknik destek</option>
                            </select>
                        </div>
                        <div className="flex flex-col gap-2">
                            <label htmlFor="message" className="text-sm font-medium text-slate-700">Mesaj</label>
                            <textarea
                                id="message"
                                value={message}
                                onChange={(event) => setMessage(event.target.value)}
                                placeholder="Talebinizi detaylandirin..."
                                className="min-h-[140px] rounded-md border border-gray-200 bg-gray-50 px-3 py-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                            />
                        </div>
                        <Button
                            type="submit"
                            loading={loading}
                            fullWidth
                            className="h-12 bg-emerald-600 hover:bg-emerald-700 text-white"
                            disabled={!subject || !message}
                        >
                            Talebi gonder
                        </Button>
                    </form>
                </div>
                <div className="app-card rounded-[24px] border border-slate-100/70 p-5 sm:p-6 space-y-4">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Talepler</p>
                        <h3 className="text-lg font-semibold text-slate-900">Son destek talepleri</h3>
                        <p className="text-sm text-slate-500">Gonderdiginiz taleplerin durumunu burada izleyin.</p>
                    </div>
                    <div className="space-y-3">
                        {loadingTickets ? (
                            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-xs text-slate-500">
                                Talepler yukleniyor...
                            </div>
                        ) : tickets.length === 0 ? (
                            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-xs text-slate-500">
                                Henuz destek talebi bulunmuyor.
                            </div>
                        ) : (
                            tickets.map((ticket) => (
                                <div key={ticket.id} className="rounded-2xl border border-slate-100 bg-white/80 px-4 py-3">
                                    <div className="flex items-center justify-between gap-2">
                                        <p className="text-sm font-semibold text-slate-900">{ticket.subject}</p>
                                        <span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${statusStyles[ticket.status as keyof typeof statusStyles] || 'bg-slate-100 text-slate-600'}`}>
                                            {ticket.status}
                                        </span>
                                    </div>
                                    <p className="mt-1 text-xs text-slate-500">{ticket.category}</p>
                                </div>
                            ))
                        )}
                    </div>
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-500">
                        Musteri basari ekibi: success@agito.com
                    </div>
                </div>
            </section>
        </div>
    );
}

'use client';

import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface Payment {
    id: string;
    amount: number;
    dueDate: string;
    status: 'PAID' | 'PENDING' | 'OVERDUE';
    policy: {
        policyNo: string;
        employee: {
            firstName: string;
            lastName: string;
        };
    };
}

export const CompanyFinancials = ({ companyId, companyName }: { companyId: string, companyName: string }) => {
    const [payments, setPayments] = useState<Payment[]>([]);
    const [stats, setStats] = useState({ total: 0, collected: 0, pending: 0, overdue: 0 });
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    const fetchPayments = async () => {
        setLoading(true);
        try {
            const res = await api.get('/payments', {
                params: {
                    companyId: companyId,
                    limit: 50 // Fetch last 50 for history
                }
            });
            setPayments(res.data.data);
            setStats(res.data.summary);
        } catch (err) {
            console.error("Failed to fetch payments", err);
            toast({
                title: "Hata",
                description: "Finansal veriler yüklenemedi.",
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (companyId) {
            fetchPayments();
        }
    }, [companyId]);

    const handleSendReminder = async (paymentId: string) => {
        try {
            await api.post(`/payments/${paymentId}/remind`);
            toast({
                title: "Başarılı",
                description: "Ödeme hatırlatması e-posta olarak gönderildi.",
                className: "bg-green-500 text-white border-green-600"
            });
        } catch (err) {
            console.error(err);
            toast({
                title: "Hata",
                description: "Hatırlatma gönderilemedi.",
                className: "bg-red-500 text-white border-red-600"
            });
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Finansal veriler yükleniyor...</div>;

    return (
        <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* ... existing KPI cards ... */}
                <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1">Toplam Alacak</div>
                    <div className="text-2xl font-bold text-gray-900">
                        {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(stats.total)}
                    </div>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-green-100 shadow-sm">
                    <div className="text-xs text-green-600 font-medium uppercase tracking-wider mb-1">Tahsil Edilen</div>
                    <div className="text-2xl font-bold text-green-700">
                        {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(stats.collected)}
                    </div>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-orange-100 shadow-sm">
                    <div className="text-xs text-orange-600 font-medium uppercase tracking-wider mb-1">Bekleyen</div>
                    <div className="text-2xl font-bold text-orange-700">
                        {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(stats.pending)}
                    </div>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-red-100 shadow-sm">
                    <div className="text-xs text-red-600 font-medium uppercase tracking-wider mb-1">Gecikmiş</div>
                    <div className="text-2xl font-bold text-red-700">
                        {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(stats.overdue)}
                    </div>
                </div>
            </div>

            {/* Actions */}
            {stats.overdue > 0 && (
                <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                            <i className="pi pi-exclamation-triangle"></i>
                        </div>
                        <div>
                            <h4 className="font-semibold text-red-900">Ödeme Gecikmesi Var</h4>
                            <p className="text-sm text-red-700">Bu şirketin toplam {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(stats.overdue)} tutarında gecikmiş ödemesi var.</p>
                        </div>
                    </div>
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button
                                    onClick={() => handleSendReminder('company-bulk')}
                                    className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors shadow-sm shadow-red-600/20"
                                >
                                    Toplu Hatırlatma Gönder
                                </button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Gecikmiş tüm ödemeler için hatırlatma e-postası gönder</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
            )}

            {/* Payments Table */}
            <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900">Ödeme Geçmişi & Planı</h3>
                    <span className="text-xs text-gray-500">Son 50 kayıt</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 text-gray-500 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-3 font-medium">Vade Tarihi</th>
                                <th className="px-6 py-3 font-medium">Poliçe No</th>
                                <th className="px-6 py-3 font-medium">Çalışan</th>
                                <th className="px-6 py-3 font-medium">Tutar</th>
                                <th className="px-6 py-3 font-medium">Durum</th>
                                <th className="px-6 py-3 font-medium text-right">İşlem</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {payments.map((payment) => (
                                <tr key={payment.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-6 py-3 font-medium text-gray-900">
                                        {format(new Date(payment.dueDate), 'd MMMM yyyy', { locale: tr })}
                                    </td>
                                    <td className="px-6 py-3 text-gray-600 font-mono text-xs bg-gray-50 rounded px-2 py-1 w-fit">
                                        {payment.policy.policyNo}
                                    </td>
                                    <td className="px-6 py-3 text-gray-600">
                                        {payment.policy.employee.firstName} {payment.policy.employee.lastName}
                                    </td>
                                    <td className="px-6 py-3 font-medium text-gray-900">
                                        {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(Number(payment.amount))}
                                    </td>
                                    <td className="px-6 py-3">
                                        <Badge variant={payment.status === 'PAID' ? 'success' : payment.status === 'PENDING' ? 'warning' : 'danger'}>
                                            {payment.status === 'PAID' ? 'Ödendi' : payment.status === 'PENDING' ? 'Bekliyor' : 'Gecikmiş'}
                                        </Badge>
                                    </td>
                                    <td className="px-6 py-3 text-right">
                                        {payment.status === 'OVERDUE' && (
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <button
                                                            onClick={() => handleSendReminder(payment.id)}
                                                            className="p-1.5 rounded-lg hover:bg-orange-50 text-orange-600 transition-colors"
                                                        >
                                                            <i className="pi pi-bell"></i>
                                                        </button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>Ödeme Hatırlat</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

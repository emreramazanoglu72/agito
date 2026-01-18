'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, FileDown, FileText, Upload } from 'lucide-react';
import { api } from '../../../../lib/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function PolicyDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [policy, setPolicy] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (params.id) {
            api.get(`/policies/${params.id}`)
                .then(res => setPolicy(res.data))
                .catch(err => {
                    console.error(err);
                    alert('Poliçe bulunamadı');
                    router.push('/dashboard/policies');
                })
                .finally(() => setLoading(false));
        }
    }, [params.id]);

    if (loading) {
        return <div className="p-8 text-center">Yükleniyor...</div>;
    }

    if (!policy) {
        return null;
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(Number(amount));
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('tr-TR');
    };

    const statusVariant = (status: string) => {
        const map: Record<string, 'success' | 'danger' | 'secondary' | 'warning' | 'default'> = {
            ACTIVE: 'success',
            CANCELLED: 'danger',
            EXPIRED: 'secondary',
            PENDING_RENEWAL: 'warning'
        };
        return map[status] || 'default';
    };

    return (
        <div className="flex flex-col gap-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.back()}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Poliçe Detayı</h1>
                        <span className="text-gray-500 text-sm">#{policy.policyNo}</span>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline">
                        <FileDown className="h-4 w-4" />
                        PDF İndir
                    </Button>
                    <Badge variant={statusVariant(policy.status)} className="text-sm px-3 py-1">
                        {policy.status}
                    </Badge>
                </div>
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: Summary Card */}
                <div className="lg:col-span-1 space-y-6">
                    <Card className="shadow-sm">
                        <CardHeader>
                            <CardTitle>Özet Bilgiler</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-col gap-4">
                                <div className="flex justify-between border-b pb-2">
                                    <span className="text-gray-500">Sigortalı</span>
                                    <span className="font-medium">{policy.employee?.firstName} {policy.employee?.lastName}</span>
                                </div>
                                <div className="flex justify-between border-b pb-2">
                                    <span className="text-gray-500">Şirket</span>
                                    <span className="font-medium">{policy.company?.name || '-'}</span>
                                </div>
                                <div className="flex justify-between border-b pb-2">
                                    <span className="text-gray-500">Türü</span>
                                    <span className="font-medium">{policy.type}</span>
                                </div>
                                <div className="flex justify-between border-b pb-2">
                                    <span className="text-gray-500">Başlangıç</span>
                                    <span className="font-medium">{formatDate(policy.startDate)}</span>
                                </div>
                                <div className="flex justify-between border-b pb-2">
                                    <span className="text-gray-500">Bitiş</span>
                                    <span className="font-medium">{formatDate(policy.endDate)}</span>
                                </div>
                                <div className="flex justify-between pt-2">
                                    <span className="text-gray-900 font-bold">Toplam Prim</span>
                                    <span className="text-indigo-600 font-bold text-lg">{formatCurrency(policy.premium)}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right: Tabs */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <Tabs defaultValue="coverages">
                            <TabsList className="m-4">
                                <TabsTrigger value="coverages">Teminatlar</TabsTrigger>
                                <TabsTrigger value="payments">Ödeme Planı</TabsTrigger>
                                <TabsTrigger value="docs">Dokümanlar</TabsTrigger>
                            </TabsList>

                            <TabsContent value="coverages">
                                <div className="p-4">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm text-left text-gray-500">
                                            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                                                <tr>
                                                    <th className="px-4 py-3">Teminat Adı</th>
                                                    <th className="px-4 py-3">Açıklama</th>
                                                    <th className="px-4 py-3 text-right">Limit</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {policy.coverages?.map((cov: any) => (
                                                    <tr key={cov.id} className="border-b last:border-0 hover:bg-gray-50">
                                                        <td className="px-4 py-3 font-medium text-gray-900">{cov.name}</td>
                                                        <td className="px-4 py-3">{cov.description || '-'}</td>
                                                        <td className="px-4 py-3 text-right font-mono">
                                                            {cov.limit ? formatCurrency(cov.limit) : 'Limitsiz'}
                                                        </td>
                                                    </tr>
                                                ))}
                                                {(!policy.coverages || policy.coverages.length === 0) && (
                                                    <tr>
                                                        <td colSpan={3} className="px-4 py-8 text-center text-gray-400">Teminat bilgisi bulunamadı.</td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="payments">
                                <div className="p-4">
                                    <table className="w-full text-sm text-left text-gray-500">
                                        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                                            <tr>
                                                <th className="px-4 py-3">Taksit</th>
                                                <th className="px-4 py-3">Vade Tarihi</th>
                                                <th className="px-4 py-3">Tutar</th>
                                                <th className="px-4 py-3 text-center">Durum</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {policy.payments?.map((pay: any) => (
                                                <tr key={pay.id} className="border-b last:border-0 hover:bg-gray-50">
                                                    <td className="px-4 py-3">{pay.installmentNo}. Taksit</td>
                                                    <td className="px-4 py-3">{formatDate(pay.dueDate)}</td>
                                                    <td className="px-4 py-3 font-mono">{formatCurrency(pay.amount)}</td>
                                                    <td className="px-4 py-3 text-center">
                                                        {pay.status === 'PAID' ? (
                                                            <span className="text-green-600 font-bold text-xs px-2 py-1 bg-green-100 rounded-full">ÖDENDİ</span>
                                                        ) : (
                                                            <span className="text-yellow-600 font-bold text-xs px-2 py-1 bg-yellow-100 rounded-full">BEKLİYOR</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </TabsContent>

                            <TabsContent value="docs">
                                <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="border border-gray-200 rounded-lg p-4 flex items-center gap-4 hover:border-indigo-500 hover:shadow-md transition-all cursor-pointer">
                                        <FileText className="text-red-500 h-8 w-8" />
                                        <div>
                                            <div className="font-medium text-gray-900">Poliçe.pdf</div>
                                            <div className="text-xs text-gray-500">Oluşturulma: {formatDate(policy.createdAt)}</div>
                                        </div>
                                    </div>
                                    <div className="border border-dashed border-gray-300 rounded-lg p-4 flex flex-col items-center justify-center gap-2 text-gray-400 hover:bg-gray-50 cursor-pointer">
                                        <Upload className="h-5 w-5" />
                                        <span className="text-sm">Doküman Yükle</span>
                                    </div>
                                </div>
                            </TabsContent>
                        </Tabs>
                    </div>
                </div>
            </div>
        </div>
    );
}

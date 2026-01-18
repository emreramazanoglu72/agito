'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation'; // Correct import for App Router
import { api } from '../../../../lib/api';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

// Components (We will create these inline or import if complex)
import { CompanyOverview } from './components/CompanyOverview';
import { CompanyEmployees } from './components/CompanyEmployees';
import { CompanyFinancials } from './components/CompanyFinancials';

export default function CompanyDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;

    const [company, setCompany] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!id) return;
        const fetchCompany = async () => {
            try {
                // Fetch company details (assuming endpoint exists, or fallback to list filter)
                // For now, let's assume we can GET /companies/:id
                // If not, we might need to filter from list or update backend. 
                // Based on previous files, GET /companies/:id exists but returns standard data.
                const res = await api.get(`/companies/${id}`);
                setCompany(res.data);
            } catch (err) {
                console.error("Failed to fetch company", err);
                // router.push('/dashboard/companies'); // Redirect on error?
            } finally {
                setLoading(false);
            }
        };
        fetchCompany();
    }, [id]);

    if (loading) {
        return <div className="p-8 text-center">Yükleniyor...</div>;
    }

    if (!company) {
        return <div className="p-8 text-center">Şirket bulunamadı.</div>;
    }

    return (
        <div className="flex flex-col gap-6">
            {/* Header / Hero */}
            <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-blue-500/20">
                        {company.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">{company.name}</h1>
                        <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                                <i className="pi pi-building text-xs"></i>
                                {company.sector || 'Sektör Belirtilmemiş'}
                            </span>
                            <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                            <span className="flex items-center gap-1">
                                <i className="pi pi-map-marker text-xs"></i>
                                {company.city || 'Şehir Yok'}, TR
                            </span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex flex-col items-end mr-2">
                        <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">Durum</span>
                        <Badge variant="success" className="mt-1">Aktif Müşteri</Badge>
                    </div>
                    <button onClick={() => router.back()} className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                        <i className="pi pi-times text-xl"></i>
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="financials" className="w-full">
                <TabsList className="grid w-full grid-cols-3 lg:w-[400px] mb-4">
                    <TabsTrigger value="overview">Genel Bakış</TabsTrigger>
                    <TabsTrigger value="employees">Çalışanlar</TabsTrigger>
                    <TabsTrigger value="financials">Finans</TabsTrigger>
                </TabsList>

                <TabsContent value="overview">
                    <CompanyOverview company={company} />
                </TabsContent>

                <TabsContent value="employees">
                    <CompanyEmployees companyId={id} />
                </TabsContent>

                <TabsContent value="financials">
                    <CompanyFinancials companyId={id} companyName={company.name} />
                </TabsContent>
            </Tabs>
        </div>
    );
}

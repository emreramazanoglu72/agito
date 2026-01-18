'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { clsx } from 'clsx';
import { api } from '../../lib/api';

export const PricingSection = () => {
    const [packages, setPackages] = useState<any[]>([]);
    const [loadingPackages, setLoadingPackages] = useState(true);
    const [packageError, setPackageError] = useState(false);

    useEffect(() => {
        let cancelled = false;
        const fetchPackages = async () => {
            setLoadingPackages(true);
            setPackageError(false);
            try {
                const res = await api.get('/public/packages');
                if (!cancelled) {
                    setPackages(res.data || []);
                }
            } catch (error) {
                if (!cancelled) {
                    console.error(error);
                    setPackageError(true);
                }
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

    return (
        <section id="pricing" className="py-24 bg-slate-50 relative overflow-hidden border-t border-slate-200">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-[600px] h-[600px] bg-blue-100 rounded-full blur-3xl opacity-50 pointer-events-none"></div>

            <div className="mx-auto max-w-7xl px-6 lg:px-8 relative z-10">
                <div className="text-center mb-16">
                    <h2 className="text-3xl font-extrabold text-slate-900 sm:text-4xl">Kurumsal Paketler</h2>
                    <p className="mt-4 text-lg text-slate-600 max-w-xl mx-auto">
                        İşletmenizin büyüklüğüne ve ihtiyaçlarına en uygun sigorta çözümünü seçin.
                    </p>
                </div>

                <div className="grid lg:grid-cols-3 gap-8 items-start">
                    {loadingPackages && (
                        <>
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="rounded-3xl border border-slate-100 bg-white p-8 shadow-sm animate-pulse">
                                    <div className="h-4 w-24 bg-slate-100 rounded mb-4"></div>
                                    <div className="h-8 w-48 bg-slate-100 rounded mb-8"></div>
                                    <div className="h-64 bg-slate-50 rounded-xl"></div>
                                </div>
                            ))}
                        </>
                    )}

                    {!loadingPackages && packageError && (
                        <div className="col-span-3 text-center py-12 bg-red-50 rounded-3xl border border-red-100 text-red-600">
                            Paketler yüklenirken bir sorun oluştu. Lütfen daha sonra tekrar deneyiniz.
                        </div>
                    )}

                    {!loadingPackages && !packageError && packages.map((pkg, index) => {
                        const isPopular = pkg.tier === 'GOLD' || index === 1; // Default to middle/gold being popular
                        return (
                            <div
                                key={pkg.name}
                                className={clsx(
                                    "relative rounded-3xl p-8 transition-all duration-300 flex flex-col h-full",
                                    isPopular
                                        ? "bg-slate-900 text-white shadow-2xl scale-105 z-10 ring-1 ring-white/10"
                                        : "bg-white text-slate-900 border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1"
                                )}
                            >
                                {isPopular && (
                                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-lg">
                                        En Çok Tercih Edilen
                                    </div>
                                )}

                                <div className="mb-8">
                                    <h3 className={clsx("text-lg font-semibold leading-8", isPopular ? "text-slate-300" : "text-slate-500")}>
                                        {pkg.tier}
                                    </h3>
                                    <div className="mt-4 flex items-baseline gap-x-2">
                                        <span className="text-4xl font-bold tracking-tight">{pkg.priceRange}</span>
                                        <span className={clsx("text-sm font-semibold leading-6", isPopular ? "text-slate-400" : "text-slate-500")}>/yıl</span>
                                    </div>
                                    <p className={clsx("mt-6 text-base leading-7", isPopular ? "text-slate-300" : "text-slate-600")}>
                                        {pkg.focus}
                                    </p>
                                </div>

                                <Link
                                    href={`/auth/register?package=${pkg.id}`}
                                    className={clsx(
                                        "mt-auto block w-full rounded-2xl px-6 py-4 text-center text-sm font-semibold leading-6 shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 transition-all",
                                        isPopular
                                            ? "bg-blue-600 text-white hover:bg-blue-500 focus-visible:outline-blue-600"
                                            : "bg-blue-50 text-blue-700 hover:bg-blue-100 ring-1 ring-inset ring-blue-200/50"
                                    )}
                                >
                                    Hemen Başvur
                                </Link>

                                <ul role="list" className={clsx("mt-8 space-y-3 text-sm leading-6", isPopular ? "text-slate-300" : "text-slate-600")}>
                                    {(pkg.highlights || []).map((feature: string) => (
                                        <li key={feature} className="flex gap-x-3">
                                            <i className={clsx("pi pi-check text-sm mt-1", isPopular ? "text-blue-400" : "text-blue-600")}></i>
                                            {feature}
                                        </li>
                                    ))}
                                    <li className="flex gap-x-3 opacity-50">
                                        <i className={clsx("pi pi-check text-sm mt-1", isPopular ? "text-blue-400" : "text-blue-600")}></i>
                                        7/24 Müşteri Desteği
                                    </li>
                                </ul>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
};

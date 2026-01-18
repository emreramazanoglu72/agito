'use client';

import React from 'react';
import { BulkWizard } from '../../../components/organisms/bulk-wizard/BulkWizard';

export default function BulkUploadPage() {
   

    return (
        <div className="flex flex-col gap-6">
            <section className="app-card rounded-[24px] p-5 sm:p-6">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                        <span className="text-xs uppercase tracking-[0.3em] text-slate-400">Toplu İşlem</span>
                        <h2 className="mt-2 text-2xl font-semibold text-slate-900">Toplu Veri Yükleme</h2>
                        <p className="mt-1 text-sm text-slate-500">
                            Excel veya CSV dosyalarınızı yükleyerek eşleştirme ve doğrulama akışını başlatın.
                        </p>
                    </div>
                    <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                        Desteklenen formatlar: .xlsx, .xls, .csv
                    </div>
                </div>
            </section>

            <section className="app-card rounded-[24px] p-5 sm:p-6">
                <BulkWizard />
            </section>
        </div>
    );
}

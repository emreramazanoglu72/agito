'use client';

import React from 'react';
import { BulkWizard } from '../../../components/organisms/bulk-wizard/BulkWizard';

export default function OperationsPage() {
    return (
        <div className="flex flex-col gap-8">
            <section className="app-card rounded-[24px] p-5 sm:p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <span className="text-xs uppercase tracking-[0.3em] text-slate-400">Araçlar</span>
                        <h2 className="mt-2 text-2xl font-semibold text-slate-900">Toplu İşlemler</h2>
                        <p className="mt-1 text-sm text-slate-500">Excel ile toplu poliçe veya çalışan yükleme sihirbazı.</p>
                    </div>
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                        İşlem merkezi
                    </span>
                </div>
            </section>

            <section className="app-card rounded-[24px] p-5 sm:p-6">
                <BulkWizard />
            </section>
        </div>
    );
}

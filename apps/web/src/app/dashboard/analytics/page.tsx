"use client";

import React, { useMemo } from 'react';
import { useAnalyticsDashboard } from '@/hooks/useAnalyticsDashboard';

const STATUS_STYLES: Record<string, { label: string; color: string; bg: string }> = {
  QUEUED: { label: 'Sırada', color: 'text-amber-600', bg: 'bg-amber-50' },
  PROCESSING: { label: 'İşleniyor', color: 'text-sky-600', bg: 'bg-sky-50' },
  COMPLETED: { label: 'Tamamlandı', color: 'text-emerald-600', bg: 'bg-emerald-50' },
  PARTIAL_SUCCESS: { label: 'Kısmi', color: 'text-orange-600', bg: 'bg-orange-50' },
  FAILED: { label: 'Hata', color: 'text-rose-600', bg: 'bg-rose-50' }
};

const formatDateTime = (value?: string) =>
  value
    ? new Date(value).toLocaleString('tr-TR', {
        dateStyle: 'short',
        timeStyle: 'short'
      })
    : '-';

const formatDuration = (start?: string, end?: string) => {
  if (!start) return '-';
  const startTime = new Date(start).getTime();
  const endTime = end ? new Date(end).getTime() : Date.now();
  const diffMinutes = Math.max(0, Math.round((endTime - startTime) / 1000 / 60));
  if (diffMinutes < 1) return '<1 dk';
  if (diffMinutes < 60) return `${diffMinutes} dk`;
  const hours = Math.floor(diffMinutes / 60);
  const minutes = diffMinutes % 60;
  return `${hours} saat${minutes ? ` ${minutes} dk` : ''}`;
};

export default function AnalyticsDashboardPage() {
  const { data, isLoading, isError } = useAnalyticsDashboard();

  const stats = data?.stats;
  const bulkStats = data?.bulkOperations;
  const recentOperations = bulkStats?.recent ?? [];
  const statusSummary: Record<string, number> = bulkStats?.summary ?? {};

  const summaryCards = [
    {
      label: 'Toplam Poliçe',
      value: stats?.totalPolicies ?? '-',
      helper: 'Portföy yenileme hacmi'
    },
    {
      label: 'Aktif Poliçe',
      value: stats?.activePolicies ?? '-',
      helper: 'Canlı yaşayan sözleşmeler'
    },
    {
      label: 'Toplam Şirket',
      value: stats?.totalCompanies ?? '-',
      helper: 'Kurumsal müşteriler'
    }
  ];

  const statusTiles = useMemo(
    () =>
      Object.entries(STATUS_STYLES).map(([key, style]) => ({
        status: key,
        count: statusSummary[key] ?? 0,
        label: style.label,
        color: style.color,
        bg: style.bg
      })),
    [statusSummary]
  );

  return (
    <div className="space-y-8 p-8">
      <header className="rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 p-6 text-white shadow-xl shadow-slate-900/40">
        <p className="text-xs font-semibold uppercase tracking-[0.4em] text-emerald-200">Analytics</p>
        <h1 className="mt-2 text-3xl font-semibold">Bulk İşlem Durumları</h1>
        <p className="mt-2 max-w-3xl text-sm text-white/70">
          Son yüklemelerin durumu, işlenen satır sayısı ve işlem süreleri bu alanda gerçek zamanlı olarak sunulur.
          Takımdaki herkes için operasyonun hangi noktada olduğunu hızla görebilirsiniz.
        </p>
        <div className="mt-4 flex flex-wrap gap-3 text-xs font-semibold">
          {statusTiles.map((tile) => (
            <span
              key={tile.status}
              className={`rounded-full px-3 py-1 ${tile.bg} ${tile.color} border border-current border-opacity-10`}
            >
              {tile.label}: {tile.count}
            </span>
          ))}
        </div>
      </header>

      <section className="grid gap-4 lg:grid-cols-3">
        {summaryCards.map((card) => (
          <div key={card.label} className="rounded-2xl border border-slate-100/70 bg-white/70 px-5 py-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">{card.label}</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{isLoading ? '...' : card.value}</p>
            <p className="mt-1 text-xs text-slate-500">{card.helper}</p>
          </div>
        ))}
      </section>

      <section className="space-y-4 rounded-[26px] border border-slate-100 bg-white/90 p-4 shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100/70 pb-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Bulk İşlem Durumları</h2>
            <p className="text-xs text-slate-500">En son yüklenen Excel/CSV işlemleri</p>
          </div>
          <div className="text-xs font-semibold text-slate-500">Güncellendi {isLoading ? '...' : '1 dk'} önce</div>
        </div>
        {isError && (
          <div className="rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-600">
            Durum bilgisi alınamadı. Lütfen sayfayı yenileyin.
          </div>
        )}
        <div className="overflow-x-auto rounded-2xl">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-[0.3em] text-slate-500">
                <th className="px-4 py-3">İşlem</th>
                <th className="px-4 py-3">Dosya / Tip</th>
                <th className="px-4 py-3">Durum</th>
                <th className="px-4 py-3">Satırlar</th>
                <th className="px-4 py-3">Başlatıldı</th>
                <th className="px-4 py-3">Süre</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentOperations.length === 0 && !isLoading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-xs text-slate-400">
                    Kaydedilmiş bulk işlemi bulunamadı.
                  </td>
                </tr>
              ) : (
                recentOperations.map((operation:any) => {
                  const statusStyle = STATUS_STYLES[operation.status] ?? {
                    label: operation.status,
                    color: 'text-slate-600',
                    bg: 'bg-slate-100'
                  };
                  return (
                    <tr key={operation.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-4 font-medium text-slate-900">
                        {operation.fileName ?? operation.type}
                      </td>
                      <td className="px-4 py-4 text-xs uppercase tracking-[0.3em] text-slate-500">
                        {operation.type}
                      </td>
                      <td className="px-4 py-4">
                        <span className={`rounded-full border border-current border-opacity-10 px-3 py-1 text-[11px] font-semibold ${statusStyle.bg} ${statusStyle.color}`}>
                          {statusStyle.label}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-700">
                        {operation.processedRows ?? 0} / {operation.totalRows ?? '-'}
                      </td>
                      <td className="px-4 py-4 text-xs text-slate-500">{formatDateTime(operation.createdAt)}</td>
                      <td className="px-4 py-4 text-xs text-slate-500">{formatDuration(operation.createdAt, operation.updatedAt)}</td>
                    </tr>
                  );
                })
              )}
              {isLoading && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-xs text-slate-400">
                    Veri yükleniyor...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import { AlertTriangle, ArrowLeft, CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { WizardData } from './BulkWizard';
import { api } from '@/lib/api';

interface Props {
    data: WizardData;
    onUpdate: (data: Partial<WizardData>) => void;
    onNext: () => void;
    onPrev: () => void;
}

export function ValidationStep({ data, onUpdate: _onUpdate, onNext, onPrev }: Props) {
    const [committing, setCommitting] = useState(false);

    const handleCommit = async () => {
        if (!data.operationId) {
            console.error('No operation ID');
            return;
        }

        setCommitting(true);
        try {
            await api.post(`/bulk/${data.operationId}/commit`, { mappings: data.mappings });
            onNext(); // Move to final step
        } catch (error) {
            console.error('Commit failed', error);
        } finally {
            setCommitting(false);
        }
    };

    const previewColumns = data.parsedData.length > 0 ? Object.keys(data.parsedData[0]) : [];

    return (
        <div className="p-6">
            <h2 className="text-xl font-bold mb-2">Veri Doğrulama</h2>
            <p className="mb-6 text-gray-500">İçe aktarılacak verileri kontrol edin ve onaylayın.</p>

            {data.parsedData.length > 0 ? (
                <>
                    <div className="bg-green-50 text-green-700 p-4 rounded-xl mb-6 border border-green-200 flex items-center gap-3">
                        <CheckCircle2 className="h-5 w-5" />
                        <span><strong>{data.parsedData.length}</strong> satır başarıyla okundu. Hatalı kayıt bulunmuyor.</span>
                    </div>

                    <div className="border rounded-xl overflow-hidden">
                        <div className="max-h-[300px] overflow-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        {previewColumns.map((col) => (
                                            <TableHead key={col}>{col}</TableHead>
                                        ))}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data.parsedData.map((row, index) => (
                                        <TableRow key={index}>
                                            {previewColumns.map((col) => (
                                                <TableCell key={`${index}-${col}`}>{String(row[col] ?? '')}</TableCell>
                                            ))}
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                </>
            ) : (
                <div className="bg-yellow-50 text-yellow-700 p-4 rounded-xl mb-6 border border-yellow-200 flex items-center gap-3">
                    <AlertTriangle className="h-5 w-5" />
                    <span>Önizleme verisi bulunamadı.</span>
                </div>
            )}

            <div className="flex justify-between mt-8">
                <Button variant="ghost" onClick={onPrev} className="text-gray-600" disabled={committing}>
                    <ArrowLeft className="h-4 w-4" />
                    Geri
                </Button>
                <Button
                    onClick={handleCommit}
                    disabled={committing}
                    className="bg-emerald-600 text-white hover:bg-emerald-700"
                >
                    {committing ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            İşleniyor...
                        </>
                    ) : (
                        <>İçe Aktarmayı Başlat</>
                    )}
                </Button>
            </div>
        </div>
    );
}

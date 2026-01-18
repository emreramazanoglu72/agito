'use client';

import React, { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { WizardData } from './BulkWizard';

interface Props {
    data: WizardData;
    onUpdate: (data: Partial<WizardData>) => void;
    onNext: () => void;
    onPrev: () => void;
}

export function MappingStep({ data, onUpdate, onNext, onPrev }: Props) {
    // Extract headers from the preview data (first row)
    const excelHeaders = data.parsedData.length > 0 ? Object.keys(data.parsedData[0]) : [];

    // Default mappings state
    const [mappings, setMappings] = useState<Record<string, string>>(data.mappings || {});

    const dbFields = [
        { label: 'Yoksay', value: 'ignore' },
        { label: 'Poliçe No (policyNo)', value: 'policyNo' },
        { label: 'Prim (premium)', value: 'premium' },
        { label: 'Para Birimi (currency)', value: 'currency' },
        { label: 'Başlangıç Tarihi (startDate)', value: 'startDate' },
        { label: 'Bitiş Tarihi (endDate)', value: 'endDate' },
        { label: 'Ürün Tipi (type)', value: 'type' }
    ];

    const handleChange = (header: string, field: string) => {
        const newMappings = { ...mappings, [header]: field };
        setMappings(newMappings);
        onUpdate({ mappings: newMappings });
    };

    // Auto-guess on mount
    useEffect(() => {
        if (excelHeaders.length === 0) return;

        const initialMappings: Record<string, string> = {};
        excelHeaders.forEach(header => {
            if (mappings[header]) return;

            const lowerHeader = header.toLowerCase();
            if (lowerHeader.includes('poliçe') || lowerHeader.includes('policy')) initialMappings[header] = 'policyNo';
            else if (lowerHeader.includes('prim') || lowerHeader.includes('premium')) initialMappings[header] = 'premium';
            else if (lowerHeader.includes('başla') || lowerHeader.includes('start')) initialMappings[header] = 'startDate';
            else if (lowerHeader.includes('bit') || lowerHeader.includes('end')) initialMappings[header] = 'endDate';
            else if (lowerHeader.includes('tip') || lowerHeader.includes('type')) initialMappings[header] = 'type';
            else initialMappings[header] = 'ignore';
        });

        if (Object.keys(initialMappings).length > 0) {
            const newMappings = { ...mappings, ...initialMappings };
            setMappings(newMappings);
            onUpdate({ mappings: newMappings });
        }
    }, [excelHeaders.length]);

    return (
        <div className="p-6">
            <h2 className="text-xl font-bold mb-2">Sütun Eşleştirme</h2>
            <p className="mb-6 text-gray-500">Excel dosyanızdaki sütunları sistemdeki alanlarla eşleştirin.</p>

            <div className="border border-gray-200 rounded-xl overflow-hidden">
                <div className="bg-gray-50 p-3 grid grid-cols-2 gap-4 font-semibold text-sm text-gray-700 border-b">
                    <div>Excel Sütunu</div>
                    <div>Hedef Alan</div>
                </div>

                <div className="bg-white p-4 space-y-4 max-h-[400px] overflow-y-auto">
                    {excelHeaders.map((header) => (
                        <div key={header} className="grid grid-cols-2 gap-4 items-center">
                            <div className="font-medium text-gray-900">{header}</div>
                            <Select
                                value={mappings[header] || ''}
                                onValueChange={(val) => handleChange(header, val)}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Seçiniz" />
                                </SelectTrigger>
                                <SelectContent>
                                    {dbFields.map((field) => (
                                        <SelectItem key={field.value} value={field.value}>
                                            {field.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    ))}

                    {excelHeaders.length === 0 && (
                        <div className="text-center text-gray-400 py-8">
                            <Info className="mx-auto mb-2 h-6 w-6" />
                            <p>Henüz veri yüklenmedi.</p>
                        </div>
                    )}
                </div>
            </div>

            <div className="flex justify-between mt-8">
                <Button variant="ghost" onClick={onPrev} className="text-gray-600">
                    <ArrowLeft className="h-4 w-4" />
                    Geri
                </Button>
                <Button onClick={onNext} className="bg-black text-white hover:bg-slate-800">
                    Devam Et
                    <ArrowRight className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}

'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { UploadStep } from './UploadStep';
import { MappingStep } from './MappingStep';
import { ValidationStep } from './ValidationStep';
import { ProgressStep } from './ProgressStep';

export type WizardData = {
    file: File | null;
    fileName: string;
    mappings: Record<string, string>;
    parsedData: any[];
    validationErrors: any[];
    operationId: string | null;
    companyId?: string;
};

export function BulkWizard() {
    const [activeIndex, setActiveIndex] = useState(0);
    const [wizardData, setWizardData] = useState<WizardData>({
        file: null,
        fileName: '',
        mappings: {},
        parsedData: [],
        validationErrors: [],
        operationId: null
    });

    const items = [
        { label: 'Yükleme' },
        { label: 'Eşleştirme' },
        { label: 'Doğrulama' },
        { label: 'Tamamla' }
    ];

    const updateData = (partial: Partial<WizardData>) => {
        setWizardData(prev => ({ ...prev, ...partial }));
    };

    const nextStep = () => setActiveIndex(prev => prev + 1);
    const prevStep = () => setActiveIndex(prev => prev - 1);

    const renderStep = () => {
        switch (activeIndex) {
            case 0:
                return <UploadStep data={wizardData} onUpdate={updateData} onNext={nextStep} />;
            case 1:
                return <MappingStep data={wizardData} onUpdate={updateData} onNext={nextStep} onPrev={prevStep} />;
            case 2:
                return <ValidationStep data={wizardData} onUpdate={updateData} onNext={nextStep} onPrev={prevStep} />;
            case 3:
                return <ProgressStep data={wizardData} onUpdate={updateData} />;
            default:
                return null;
        }
    };

    return (
        <div className="w-full max-w-5xl mx-auto">
            <div className="mb-8">
                <div className="flex flex-wrap items-center gap-4">
                    {items.map((item, index) => {
                        const isActive = index === activeIndex;
                        const isDone = index < activeIndex;
                        return (
                            <div key={item.label} className="flex items-center gap-3">
                                <div
                                    className={cn(
                                        "flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold",
                                        isActive || isDone
                                            ? "bg-primary text-primary-foreground"
                                            : "bg-slate-200 text-slate-600"
                                    )}
                                >
                                    {index + 1}
                                </div>
                                <span
                                    className={cn(
                                        "text-sm font-semibold",
                                        isActive ? "text-slate-900" : "text-slate-500"
                                    )}
                                >
                                    {item.label}
                                </span>
                                {index < items.length - 1 && (
                                    <span className="hidden sm:block h-px w-10 bg-slate-200"></span>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            <Card className="shadow-lg rounded-[28px]">
                {renderStep()}
            </Card>
        </div>
    );
}

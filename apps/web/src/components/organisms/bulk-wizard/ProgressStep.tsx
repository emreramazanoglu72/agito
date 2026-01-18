'use client';

import React, { useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { WizardData } from './BulkWizard';

interface Props {
    data: WizardData;
    onUpdate: (data: Partial<WizardData>) => void;
}

export function ProgressStep({ data: _data, onUpdate: _onUpdate }: Props) {
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    clearInterval(interval);
                    return 100;
                }
                return prev + 10;
            });
        }, 500);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="p-12 text-center">
            {progress < 100 ? (
                <>
                    <h2 className="text-xl font-bold mb-4">İşlem Sürüyor...</h2>
                    <p className="text-gray-500 mb-8">Veriler veritabanına aktarılıyor, lütfen bekleyiniz.</p>
                    <Progress value={progress} className="h-3" />
                    <div className="mt-3 text-sm text-muted-foreground">%{progress}</div>
                </>
            ) : (
                <div className="animate-fade-in">
                    <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Check className="h-6 w-6" />
                    </div>
                    <h2 className="text-2xl font-bold mb-2">İşlem Tamamlandı!</h2>
                    <p className="text-gray-500 mb-8">Tüm veriler başarıyla aktarıldı.</p>
                    <Button onClick={() => window.location.href = '/dashboard/policies'} className="bg-black text-white hover:bg-slate-800">
                        Listeye Dön
                    </Button>
                </div>
            )}
        </div>
    );
}

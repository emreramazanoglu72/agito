'use client';

import React, { useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useBulkStore } from './store';

export const ResultStep = () => {
    const { mappedData, isUploading, uploadProgress, setIsUploading, setUploadProgress } = useBulkStore();
    const [isComplete, setIsComplete] = useState(false);

    useEffect(() => {
        if (!isComplete && !isUploading) {
            startUpload();
        }
    }, []);

    const startUpload = async () => {
        setIsUploading(true);
        setUploadProgress(0);

        // Simulation of API usage
        // In real app, we would batch send mappedData to backend
        let current = 0;

        const interval = setInterval(() => {
            current += 10;
            setUploadProgress(current);

            if (current >= 100) {
                clearInterval(interval);
                setIsUploading(false);
                setIsComplete(true);
            }
        }, 300); // Simulate network speed
    };

    return (
        <div className="flex flex-col items-center justify-center p-4 text-center">
            {isUploading && (
                <div className="w-full md:w-6">
                    <h3 className="mb-2 text-xl font-semibold">Veriler yükleniyor...</h3>
                    <p className="text-sm text-muted-foreground mb-4">{mappedData.length} kayıt işleniyor.</p>
                    <Progress value={uploadProgress} className="h-2" />
                </div>
            )}

            {isComplete && (
                <div className="animate-fade-in">
                    <div className="inline-flex items-center justify-center bg-emerald-100 rounded-full w-16 h-16 mb-4">
                        <Check className="h-6 w-6 text-emerald-600" />
                    </div>
                    <h2 className="mb-2 text-xl font-semibold">İşlem tamamlandı!</h2>
                    <p className="text-sm text-muted-foreground mb-5">{mappedData.length} adet kayıt başarıyla sisteme aktarıldı.</p>
                </div>
            )}
        </div>
    );
};

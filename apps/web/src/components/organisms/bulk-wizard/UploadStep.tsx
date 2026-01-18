'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Loader2, UploadCloud, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { WizardData } from './BulkWizard';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';

interface Props {
    data: WizardData;
    onUpdate: (data: Partial<WizardData>) => void;
    onNext: () => void;
}

export function UploadStep({ data, onUpdate, onNext }: Props) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const { toast } = useToast();
    const [companies, setCompanies] = useState<any[]>([]);
    const [loadingCompanies, setLoadingCompanies] = useState(true);

    useEffect(() => {
        let cancelled = false;
        const fetchCompanies = async () => {
            setLoadingCompanies(true);
            try {
                const response = await api.get('/companies');
                const list = Array.isArray(response.data) ? response.data : response.data?.data || [];
                if (!cancelled) {
                    setCompanies(list);
                    if (!data.companyId && list.length === 1) {
                        onUpdate({ companyId: list[0].id });
                    }
                }
            } catch (error) {
                console.error(error);
            } finally {
                if (!cancelled) {
                    setLoadingCompanies(false);
                }
            }
        };
        fetchCompanies();
        return () => {
            cancelled = true;
        };
    }, [data.companyId, onUpdate]);

    const handleUpload = async (file: File) => {
        if (!data.companyId) {
            toast({ title: 'Sirket secin', description: 'Dosya yuklemeden once sirket secilmelidir.' });
            return;
        }
        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('companyId', data.companyId);
        formData.append('type', 'BULK_UPLOAD');

        try {
            const res = await api.post('/bulk/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            onUpdate({
                file,
                fileName: file.name,
                parsedData: res.data.previewData || [],
                operationId: res.data.jobId
            });
        } catch (error) {
            console.error('Upload failed', error);
        } finally {
            setUploading(false);
        }
    };

    const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            await handleUpload(file);
        }
    };

    const handleDrop = async (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        setDragActive(false);
        const file = event.dataTransfer.files?.[0];
        if (file) {
            await handleUpload(file);
        }
    };

    const handleClear = () => {
        onUpdate({ file: null, fileName: '', parsedData: [] });
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div className="flex flex-col items-center justify-center p-8 gap-6">
            <div className="text-center">
                <h2 className="text-xl font-bold text-gray-900 mb-2">Dosya Yükle</h2>
                <p className="text-gray-500">Excel veya CSV dosyanızı buraya sürükleyin.</p>
            </div>

            <div className="w-full max-w-2xl">
                <label className="text-sm font-medium text-slate-700">Sirket secimi</label>
                <select
                    value={data.companyId || ''}
                    onChange={(event) => onUpdate({ companyId: event.target.value })}
                    className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    disabled={loadingCompanies || companies.length === 0}
                >
                    <option value="" disabled>
                        {loadingCompanies ? 'Sirketler yukleniyor...' : 'Sirket secin'}
                    </option>
                    {companies.map((company) => (
                        <option key={company.id} value={company.id}>
                            {company.name}
                        </option>
                    ))}
                </select>
            </div>

            {uploading ? (
                <div className="flex flex-col items-center gap-4 py-12">
                    <Loader2 className="h-10 w-10 animate-spin text-slate-600" />
                    <p className="text-gray-500">Dosya yükleniyor...</p>
                </div>
            ) : (
                <div
                    className={cn(
                        "w-full max-w-2xl rounded-2xl border-2 border-dashed border-slate-200 bg-white/80 p-6 text-center transition",
                        dragActive && "border-primary bg-primary/5"
                    )}
                    onDragOver={(event) => {
                        event.preventDefault();
                        setDragActive(true);
                    }}
                    onDragLeave={() => setDragActive(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    role="button"
                    tabIndex={0}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".xlsx,.csv"
                        className="hidden"
                        onChange={handleFileSelect}
                    />
                    <div className="flex flex-col items-center gap-3 py-6">
                        <UploadCloud className="h-8 w-8 text-slate-500" />
                        <p className="text-sm text-slate-500">Dosyayı buraya sürükleyip bırakın.</p>
                        <Button variant="outline" type="button">
                            Dosya Seç
                        </Button>
                        {data.fileName && (
                            <div className="flex items-center gap-2 text-xs text-slate-500">
                                <span>Seçilen: {data.fileName}</span>
                                <button
                                    type="button"
                                    onClick={(event) => {
                                        event.stopPropagation();
                                        handleClear();
                                    }}
                                    className="rounded-full p-1 hover:bg-slate-100"
                                    aria-label="Dosyayı kaldır"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <div className="flex justify-end w-full max-w-2xl mt-4">
                <Button
                    onClick={onNext}
                    disabled={!data.file || uploading}
                    className="bg-black text-white hover:bg-slate-800"
                >
                    Devam Et
                </Button>
            </div>
        </div>
    );
}

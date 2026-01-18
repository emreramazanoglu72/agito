'use client';

import React, { useCallback, useState, useEffect } from 'react';
import { useDropzone, FileRejection } from 'react-dropzone';
import { UploadCloud, FileText, AlertCircle, User, Loader2, Camera } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FilePreviewCard, FilePreviewProps } from '../../molecules/file-upload/FilePreviewCard';
import { api } from '@/lib/api';

export interface UploadConfig {
    endpoint?: string;
    description?: string;
    accept?: Record<string, string[]>;
    maxSize?: number; // bytes
    maxFiles?: number;
    showPreview?: boolean;
    autoUpload?: boolean;
    variant?: 'dropzone' | 'avatar';
}

interface AdvancedDropzoneProps {
    config?: UploadConfig;
    value?: File[] | string; // File[] for normal, string (URL) for avatar
    onChange?: (value: any) => void;
    disabled?: boolean;
    error?: string;
}

export const AdvancedDropzone: React.FC<AdvancedDropzoneProps> = ({
    config = {},
    value,
    onChange,
    disabled = false,
    error
}) => {
    const {
        accept = { 'image/*': ['.png', '.jpg', '.jpeg', '.webp'], 'application/pdf': ['.pdf'] },
        maxSize = 5 * 1024 * 1024, // 5MB
        maxFiles = 5,
        description = "Dosyaları buraya sürükleyin veya seçmek için tıklayın",
        showPreview = true,
        variant = 'dropzone',
        autoUpload = false,
        endpoint
    } = config;

    const [fileStates, setFileStates] = useState<Map<string, { status: FilePreviewProps['status'], progress: number, error?: string }>>(new Map());
    const [isUploading, setIsUploading] = useState(false);

    const onDrop = useCallback(async (acceptedFiles: File[], fileRejections: FileRejection[]) => {
        if (disabled || isUploading) return;

        if (fileRejections.length > 0) {
            // Handle rejections if needed
        }

        if (acceptedFiles.length === 0) return;

        // Auto Upload Logic
        if (autoUpload && endpoint) {
            setIsUploading(true);
            try {
                // Determine what to upload. If maxFiles=1, take first.
                const fileToUpload = acceptedFiles[0];

                const formData = new FormData();
                formData.append('file', fileToUpload);

                // Optimistic UI for Avatar
                if (variant === 'avatar') {
                    // Create object URL for immediate preview
                    const previewUrl = URL.createObjectURL(fileToUpload);
                    // Just show local state? No, we should probably wait for upload if it's auto.
                }

                const response = await api.post(endpoint, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                    onUploadProgress: (progressEvent) => {
                        const progress = progressEvent.total
                            ? Math.round((progressEvent.loaded * 100) / progressEvent.total)
                            : 0;
                        setFileStates(prev => new Map(prev).set(fileToUpload.name, { status: 'uploading', progress }));
                    }
                });

                // Success
                setFileStates(prev => new Map(prev).set(fileToUpload.name, { status: 'success', progress: 100 }));

                // Assuming backend returns { url: string } or { key, url }
                if (response.data?.url) {
                    onChange?.(response.data.url);
                } else {
                    onChange?.(response.data);
                }

            } catch (err) {
                console.error('Upload failed', err);
                // Error handling
            } finally {
                setIsUploading(false);
            }
        } else {
            // Default Manual Logic (Queueing)
            const currentFiles = Array.isArray(value) ? value : [];
            const newFiles = [...currentFiles, ...acceptedFiles].slice(0, maxFiles);
            onChange?.(newFiles);

            acceptedFiles.forEach(file => {
                setFileStates(prev => new Map(prev).set(file.name, { status: 'pending', progress: 0 }));
            });
        }

    }, [value, maxFiles, onChange, autoUpload, endpoint, variant, isUploading, disabled]);

    const removeFile = (fileToRemove: File) => {
        if (disabled) return;
        if (Array.isArray(value)) {
            const newFiles = value.filter(f => f !== fileToRemove);
            onChange?.(newFiles);
        }
    };

    const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
        onDrop,
        accept,
        maxSize,
        maxFiles,
        disabled: disabled || isUploading,
        multiple: maxFiles > 1
    });

    // Calculate preview URL safely (Unconditional Hook)
    const previewUrl = React.useMemo(() => {
        if (typeof value === 'string') return value;
        if (Array.isArray(value) && value.length > 0 && value[0] instanceof File) {
            return URL.createObjectURL(value[0]);
        }
        return null;
    }, [value]);

    // AVATAR VARIANT
    if (variant === 'avatar') {

        return (
            <div className="flex flex-col items-center gap-3">
                <div
                    {...getRootProps()}
                    className={cn(
                        "relative flex h-32 w-32 items-center justify-center overflow-hidden rounded-full border-2 transition-all cursor-pointer group",
                        isDragActive ? "border-teal-500 scale-105" : "border-slate-200 hover:border-teal-500",
                        error ? "border-red-500" : "",
                        disabled && "opacity-60 cursor-not-allowed"
                    )}
                >
                    <input {...getInputProps()} />

                    {previewUrl ? (
                        <div className="relative h-full w-full">
                            <img src={previewUrl} alt="Avatar" className="h-full w-full object-cover" />
                            {/* Overlay */}
                            <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Camera className="h-8 w-8 text-white" />
                            </div>
                        </div>
                    ) : (
                        <div className="flex h-full w-full items-center justify-center bg-slate-50 text-slate-400 group-hover:bg-slate-100 group-hover:text-slate-500">
                            <User className="h-12 w-12" />
                        </div>
                    )}

                    {isUploading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                            <Loader2 className="h-8 w-8 animate-spin text-white" />
                        </div>
                    )}
                </div>
                {error && <span className="text-xs text-red-500">{error}</span>}
            </div>
        );
    }

    // DEFAULT DROPZONE VARIANT
    return (
        <div className="space-y-4">
            <div
                {...getRootProps()}
                className={cn(
                    "relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 transition-all duration-200 ease-in-out cursor-pointer",
                    isDragActive ? "border-teal-500 bg-teal-50/50 scale-[0.99]" : "border-slate-200 bg-slate-50/50 hover:bg-slate-100/50 hover:border-teal-200",
                    isDragReject && "border-red-500 bg-red-50/50",
                    error && "border-red-200 bg-red-50/30",
                    disabled && "opacity-60 cursor-not-allowed hover:bg-slate-50 hover:border-slate-200"
                )}
            >
                <input {...getInputProps()} />

                <div className={cn(
                    "mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-slate-900/5 transition-transform duration-300",
                    isDragActive && "scale-110 ring-teal-500/20"
                )}>
                    {isDragReject || error ? (
                        <AlertCircle className="h-8 w-8 text-red-500" />
                    ) : (
                        <UploadCloud className={cn("h-8 w-8 text-slate-400", isDragActive && "text-teal-600")} />
                    )}
                </div>

                <div className="text-center space-y-1">
                    <p className="text-sm font-semibold text-slate-700">
                        {isDragActive ? "Dosyaları bırakın" : "Dosya Yükle"}
                    </p>
                    <p className="text-xs text-slate-500 max-w-[240px] mx-auto leading-relaxed">
                        {description}
                    </p>
                </div>

                <div className="mt-4 flex gap-2">
                    <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-1 text-[10px] font-medium text-slate-500">
                        Max {maxSize / 1024 / 1024}MB
                    </span>
                    <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-1 text-[10px] font-medium text-slate-500">
                        {Object.keys(accept).map(k => k.split('/')[1]).join(', ').toUpperCase()}
                    </span>
                </div>
            </div>

            {error && (
                <div className="flex items-center gap-2 text-xs text-red-600 px-1">
                    <AlertCircle className="h-3.5 w-3.5" />
                    <span>{error}</span>
                </div>
            )}

            {/* Preview List */}
            {showPreview && Array.isArray(value) && value.length > 0 && (
                <div className="grid gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                    {value.map((file, idx) => (
                        <FilePreviewCard
                            key={`${file.name}-${idx}`}
                            file={file}
                            status={fileStates.get(file.name)?.status || 'pending'}
                            progress={fileStates.get(file.name)?.progress || 0}
                            error={fileStates.get(file.name)?.error}
                            onRemove={() => removeFile(file)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

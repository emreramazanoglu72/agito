import React from 'react';
import { FileText, X, Check, Loader2, Image as ImageIcon, Trash2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { Button } from '@/components/atoms/Button';

export interface FilePreviewProps {
    file: File;
    progress?: number;
    status: 'pending' | 'uploading' | 'success' | 'error';
    error?: string;
    onRemove: () => void;
}

export const FilePreviewCard: React.FC<FilePreviewProps> = ({
    file,
    progress = 0,
    status,
    error,
    onRemove
}) => {
    const isImage = file.type.startsWith('image/');
    const previewUrl = isImage ? URL.createObjectURL(file) : null;

    return (
        <div className={cn(
            "group relative flex items-center gap-4 rounded-xl border p-3 transition-all",
            status === 'error' ? "border-red-200 bg-red-50/50" : "border-slate-200 bg-white hover:border-teal-200"
        )}>
            {/* Thumbnail / Icon */}
            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-slate-100 flex items-center justify-center border border-slate-100">
                {isImage && previewUrl ? (
                    <img src={previewUrl} alt={file.name} className="h-full w-full object-cover" />
                ) : (
                    <FileText className="h-6 w-6 text-slate-400" />
                )}
                {status === 'success' && (
                    <div className="absolute inset-0 flex items-center justify-center bg-teal-500/80 backdrop-blur-[1px]">
                        <Check className="h-5 w-5 text-white" />
                    </div>
                )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                    <p className="truncate text-sm font-medium text-slate-700" title={file.name}>
                        {file.name}
                    </p>
                    <button
                        onClick={onRemove}
                        type="button"
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-slate-100 rounded-full text-slate-400 hover:text-red-500"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span>{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                    {status === 'error' && <span className="text-red-500">• {error || 'Yükleme başarısız'}</span>}
                </div>

                {/* Progress Bar */}
                {status === 'uploading' && (
                    <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-slate-100">
                        <div
                            className="h-full bg-teal-500 transition-all duration-300"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

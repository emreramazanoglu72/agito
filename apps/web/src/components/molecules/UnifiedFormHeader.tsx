import React from 'react';
import { Pencil, X, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DialogTitle } from '@/components/ui/dialog';
import { SheetTitle } from '@/components/ui/sheet';

interface UnifiedFormHeaderProps {
    title: string;
    subtitle?: string;
    badgeText?: string;
    onClose: () => void;
    icon?: LucideIcon;
    mode?: 'dialog' | 'sheet' | 'inline';
}

export const UnifiedFormHeader: React.FC<UnifiedFormHeaderProps> = ({
    title,
    subtitle = "Kayıt Modülü",
    badgeText = "Form",
    onClose,
    icon: Icon = Pencil,
    mode = 'dialog'
}) => {
    // Determine which Title component to use for accessibility
    const TitleComponent: React.ElementType =
        mode === 'sheet' ? SheetTitle : mode === 'dialog' ? DialogTitle : 'h2';

    return (
        <div className="relative w-full min-w-0 overflow-hidden rounded-b-[26px] bg-gradient-to-r from-slate-950 via-emerald-700 to-teal-500 text-white shadow-[0_14px_32px_rgba(15,23,42,0.28)] shrink-0">
            {/* Accessibility Title (Hidden) */}
            <TitleComponent className="sr-only">{title}</TitleComponent>

            <div className="absolute -left-16 top-0 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute right-[-70px] bottom-[-70px] h-48 w-48 rounded-full bg-emerald-300/15 blur-3xl" />
            <div className="relative z-10 flex items-start justify-between px-6 py-6 sm:px-8">
                <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/18 text-white shadow-lg shadow-emerald-900/25 backdrop-blur">
                        <Icon className="h-5 w-5" />
                    </div>
                    <div className="space-y-1">
                        <div className="text-[11px] font-semibold uppercase tracking-[0.32em] text-white/70">{subtitle}</div>
                        <div className="text-2xl font-semibold leading-tight drop-shadow-sm">{title}</div>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {badgeText && (
                        <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-[12px] font-semibold text-white/85 shadow-lg shadow-emerald-900/10 backdrop-blur">
                            <span className="h-2 w-2 rounded-full bg-emerald-300 animate-pulse" />
                            {badgeText}
                        </span>
                    )}
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex h-10 w-10 items-center justify-center rounded-full border border-white/25 bg-white/15 text-white shadow-md transition hover:border-white/50 hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
                        aria-label="Kapat"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            </div>
        </div>
    );
};

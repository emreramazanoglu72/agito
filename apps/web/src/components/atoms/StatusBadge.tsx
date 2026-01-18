import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
    status: string;
    className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className }) => {
    const getVariant = (s: string) => {
        const lower = s.toLowerCase();
        if (['active', 'paid', 'completed'].includes(lower)) return 'success';
        if (['pending', 'processing'].includes(lower)) return 'warning';
        if (['cancelled', 'expired', 'overdue', 'inactive'].includes(lower)) return 'destructive';
        return 'secondary';
    };

    const getColors = (s: string) => {
        const lower = (s || '').toLowerCase();
        if (['active', 'paid', 'completed'].includes(lower))
            return 'bg-emerald-50 text-emerald-700 border-emerald-100';
        if (['pending', 'processing'].includes(lower))
            return 'bg-amber-50 text-amber-700 border-amber-100';
        if (['cancelled', 'expired', 'overdue', 'inactive'].includes(lower))
            return 'bg-rose-50 text-rose-700 border-rose-100';
        return 'bg-slate-50 text-slate-700 border-slate-100';
    };

    return (
        <Badge
            variant="outline"
            className={cn("font-medium rounded-full px-2.5 py-0.5", getColors(status), className)}
        >
            {status}
        </Badge>
    );
};

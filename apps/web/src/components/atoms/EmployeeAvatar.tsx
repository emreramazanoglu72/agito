import React from 'react';
import { cn } from '@/lib/utils';

interface EmployeeAvatarProps {
    src?: string;
    name: string;
    className?: string;
}

export const EmployeeAvatar: React.FC<EmployeeAvatarProps> = ({ src, name, className }) => {
    const initials = (name || '')
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

    return (
        <div
            className={cn(
                "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full bg-slate-100",
                className
            )}
        >
            {src ? (
                <img
                    src={src}
                    alt={name}
                    className="aspect-square h-full w-full object-cover"
                />
            ) : (
                <div className="flex h-full w-full items-center justify-center rounded-full bg-slate-900 text-xs font-medium text-white">
                    {initials}
                </div>
            )}
        </div>
    );
};

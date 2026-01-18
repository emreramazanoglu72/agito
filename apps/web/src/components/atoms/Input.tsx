'use client';

import React from 'react';
import { Input as UiInput } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value'> {
    value?: string | number | undefined;
    label?: string;
    error?: string;
    feedback?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ label, error, className, id, feedback, value, ...props }, ref) => {
        return (
            <div className="flex flex-col gap-2">
                {label ? <Label htmlFor={id}>{label}</Label> : null}
                <UiInput
                    id={id}
                    ref={ref}
                    value={value}
                    className={cn(error && 'border-destructive focus-visible:ring-destructive', className)}
                    {...props}
                />
                {error && <small className="text-xs text-destructive">{error}</small>}
            </div>
        );
    }
);

Input.displayName = 'Input';

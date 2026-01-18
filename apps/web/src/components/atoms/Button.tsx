'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';
import { Button as UiButton } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    label?: string;
    icon?: string;
    loading?: boolean;
    fullWidth?: boolean;
    iconPos?: 'left' | 'right';
    // Catch-all for other PrimeReact props we might pass blindly, 
    // though strict typing is better, this unblocks us.
    [key: string]: any;
}

export const Button: React.FC<ButtonProps> = ({
    fullWidth,
    className,
    loading,
    label,
    icon,
    iconPos = 'left',
    children,
    ...props
}) => {
    const iconElement = icon ? <i className={icon} /> : null;

    return (
        <UiButton
            className={cn(fullWidth && 'w-full', className)}
            disabled={loading || props.disabled}
            {...props}
        >
            {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
                <>
                    {iconPos === 'left' && iconElement}
                    {label ?? children}
                    {iconPos === 'right' && iconElement}
                </>
            )}
        </UiButton>
    );
};

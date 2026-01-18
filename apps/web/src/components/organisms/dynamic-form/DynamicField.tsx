'use client';

import React, { useMemo, useState } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { AdvancedDropzone } from '../file-upload/AdvancedDropzone';
import { FieldSchema, Option } from './types';

interface DynamicFieldProps {
    field: FieldSchema;
    optionsOverride?: Option[];
    disabled?: boolean;
}

interface SearchableSelectProps {
    id: string;
    value: any;
    options: Option[];
    onChange: (value: any) => void;
    onBlur?: () => void;
    placeholder?: string;
    disabled?: boolean;
    className?: string;
    searchPlaceholder?: string;
    emptyMessage?: string;
    allowClear?: boolean;
}

const SearchableSelect = ({
    id,
    value,
    options,
    onChange,
    onBlur,
    placeholder,
    disabled,
    className,
    searchPlaceholder = 'Ara... ',
    emptyMessage = 'Sonuç bulunamadı',
    allowClear = false
}: SearchableSelectProps) => {
    const [open, setOpen] = useState(false);
    const [commandValue, setCommandValue] = useState('');
    const selectedOption = useMemo(
        () => options.find((option) => String(option.value) === String(value)),
        [options, value]
    );

    const handleOpenChange = (next: boolean) => {
        if (disabled) return;
        setOpen(next);
        if (!next) {
            onBlur?.();
        }
    };

    const handleSelect = (incoming: string) => {
        if (allowClear && incoming === '__clear__') {
            onChange(undefined);
            setOpen(false);
            onBlur?.();
            setCommandValue('');
            return;
        }

        const option = options.find((opt) => String(opt.value) === incoming);
        // Always return original option value type if found
        onChange(option ? option.value : incoming);
        setOpen(false);
        onBlur?.();
        setCommandValue('');
    };

    const currentValue = selectedOption ? String(selectedOption.value) : '';

    return (
        <Popover open={open} onOpenChange={handleOpenChange}>
            <PopoverTrigger asChild>
                <button
                    id={id}
                    type="button"
                    role="combobox"
                    aria-expanded={open}
                    disabled={disabled}
                    className={cn(
                        'flex h-12 w-full items-center justify-between rounded-xl border border-slate-200/80 bg-white px-3.5 py-2 text-sm text-slate-800 shadow-sm transition hover:border-slate-300 hover:shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:border-primary/60',
                        disabled && 'cursor-not-allowed opacity-60',
                        className
                    )}
                >
                    <span className={cn(!selectedOption && 'text-muted-foreground')}>
                        {selectedOption?.label || placeholder || 'Seçim yapın'}
                    </span>
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-[--radix-popover-trigger-width] p-0">
                <Command value={commandValue} onValueChange={setCommandValue}>
                    <CommandInput placeholder={searchPlaceholder} />
                    <CommandList>
                        <CommandEmpty>{emptyMessage}</CommandEmpty>
                        <CommandGroup>
                            {allowClear && (
                                <CommandItem value="__clear__" onSelect={handleSelect}>
                                    Temizle
                                </CommandItem>
                            )}
                            {options.map((option) => (
                                <CommandItem
                                    key={String(option.value)}
                                    value={String(option.value)}
                                    onSelect={handleSelect}
                                >
                                    <span className="flex-1">{option.label}</span>
                                    {selectedOption?.value === option.value ? (
                                        <Check className="h-4 w-4 text-primary" />
                                    ) : null}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
};

export const DynamicField: React.FC<DynamicFieldProps> = ({ field, optionsOverride, disabled }) => {
    const { control, formState: { errors } } = useFormContext();
    const error = errors[field.name]?.message as string;

    const { className: fieldClassName, searchPlaceholder, emptyMessage, allowClear, ...fieldProps } = field.props || {};
    const isDisabled = Boolean(disabled || fieldProps.disabled);

    const renderInput = (onChange: (...event: any[]) => void, value: any, onBlur: () => void) => {
        const placeholder = fieldProps.placeholder || field.placeholder || '';
        const inputClassName = cn(
            'w-full h-12 rounded-xl border border-slate-200/80 bg-white px-3.5 py-2 text-sm text-slate-800 shadow-sm transition hover:border-slate-300 hover:shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:border-primary/60',
            error && 'border-destructive focus-visible:ring-destructive',
            fieldClassName
        );

        switch (field.type) {
            case 'text':
            case 'email':
            case 'password':
                return (
                    <Input
                        id={field.name}
                        type={field.type}
                        value={value ?? ''}
                        onChange={onChange}
                        onBlur={onBlur}
                        placeholder={placeholder}
                        disabled={isDisabled}
                        className={inputClassName}
                        {...fieldProps}
                    />
                );
            case 'number':
                return (
                    <Input
                        id={field.name}
                        type="number"
                        value={value ?? ''}
                        onChange={(event) => {
                            const next = event.target.value;
                            onChange(next === '' ? undefined : Number(next));
                        }}
                        onBlur={onBlur}
                        placeholder={placeholder}
                        disabled={isDisabled}
                        className={inputClassName}
                        {...fieldProps}
                    />
                );
            case 'textarea':
                return (
                    <Textarea
                        id={field.name}
                        value={value ?? ''}
                        onChange={onChange}
                        onBlur={onBlur}
                        placeholder={placeholder}
                        disabled={isDisabled}
                        className={inputClassName}
                        {...fieldProps}
                    />
                );
            case 'select': {
                const options = optionsOverride || field.options || [];

                return (
                    <SearchableSelect
                        id={field.name}
                        value={value}
                        onChange={onChange}
                        onBlur={onBlur}
                        options={options}
                        placeholder={placeholder || 'Seçim yapın'}
                        className={inputClassName}
                        searchPlaceholder={searchPlaceholder}
                        emptyMessage={emptyMessage}
                        allowClear={allowClear}
                    />
                );
            }
            case 'date': {
                const parsedDate = value ? new Date(value) : undefined;
                const selectedDate = parsedDate && !Number.isNaN(parsedDate.getTime()) ? parsedDate : undefined;

                return (
                    <Popover>
                        <PopoverTrigger asChild>
                            <button
                                type="button"
                                className={cn(
                                    'flex h-12 w-full items-center justify-between rounded-xl border border-slate-200/80 bg-white px-3.5 py-2 text-sm text-slate-800 shadow-sm transition hover:border-slate-300 hover:shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:border-primary/60',
                                    error && 'border-destructive focus-visible:ring-destructive',
                                    isDisabled && 'cursor-not-allowed opacity-60'
                                )}
                                disabled={isDisabled}
                            >
                                <span className={cn(!selectedDate && 'text-muted-foreground')}>
                                    {selectedDate ? format(selectedDate, 'dd.MM.yyyy') : placeholder || 'Tarih seçin'}
                                </span>
                                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                            </button>
                        </PopoverTrigger>
                        <PopoverContent align="start">
                            <Calendar
                                mode="single"
                                selected={selectedDate}
                                onSelect={(date) => onChange(date ?? undefined)}
                                initialFocus
                            />
                        </PopoverContent>
                    </Popover>
                );
            }
            case 'checkbox':
                return (
                    <div className="flex items-center gap-2">
                        <Checkbox
                            id={field.name}
                            checked={Boolean(value)}
                            onCheckedChange={(checked) => onChange(Boolean(checked))}
                            disabled={isDisabled}
                            {...fieldProps}
                        />
                        <label htmlFor={field.name} className="text-sm font-medium text-foreground">
                            {field.label}
                        </label>
                    </div>
                );
            case 'file-upload':
                return (
                    <AdvancedDropzone
                        config={field.uploadConfig}
                        value={value || []}
                        onChange={onChange}
                        disabled={isDisabled}
                        error={error}
                    />
                );
            default:
                return (
                    <Input
                        id={field.name}
                        value={value ?? ''}
                        onChange={onChange}
                        onBlur={onBlur}
                        placeholder={placeholder}
                        disabled={isDisabled}
                        className={inputClassName}
                        {...fieldProps}
                    />
                );
        }
    };

    if (field.type === 'checkbox') {
        return (
            <div className="space-y-2">
                <Controller
                    name={field.name}
                    control={control}
                    render={({ field: { onChange, value, onBlur } }) => renderInput(onChange, value, onBlur)}
                />
                {error && <small className="text-xs text-destructive">{error}</small>}
            </div>
        );
    }

    return (
        <div>
            <Controller
                name={field.name}
                control={control}
                render={({ field: { onChange, value, onBlur } }) => (
                    <div className="flex flex-col gap-2">
                        <label htmlFor={field.name} className="text-xs font-semibold text-muted-foreground uppercase tracking-[0.2em]">
                            {field.label}
                        </label>
                        {renderInput(onChange, value, onBlur)}
                        {error && <small className="text-xs text-destructive">{error}</small>}
                    </div>
                )}
            />
        </div>
    );
};

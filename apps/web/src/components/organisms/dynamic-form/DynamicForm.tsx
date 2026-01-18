'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useForm, FormProvider, FieldValues, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DynamicFormProps } from './types';
import { DynamicField } from './DynamicField';
import { generateZodSchema } from './schema-generator';
import { clsx } from 'clsx';
import { api } from '../../../lib/api';
import { Option, ServiceOptionsConfig } from './types';

export const DynamicForm = <T extends FieldValues>({
    schema,
    onSubmit,
    defaultValues,
    submitLabel = 'Kaydet',
    loading = false,
    formClassName,
    gridClassName,
    itemClassName,
    getItemClassName
}: DynamicFormProps<T>) => {
    const zodSchema = useMemo(() => generateZodSchema(schema), [schema]);

    const methods = useForm<T>({
        defaultValues,
        resolver: zodResolver(zodSchema) as any
    });

    const [optionsMap, setOptionsMap] = useState<Record<string, Option[]>>({});
    const [disabledMap, setDisabledMap] = useState<Record<string, boolean>>({});
    const lastParamsRef = useRef<Record<string, string>>({});
    const watchedValues = useWatch({ control: methods.control });

    const serviceFields = useMemo(
        () => schema.filter((field) => field.type === 'select' && field.serviceOptions),
        [schema]
    );

    const hasValue = (value: any) => value !== undefined && value !== null && value !== '';

    const resolveParams = (serviceOptions: ServiceOptionsConfig, values: any) => {
        const params: Record<string, any> = { ...(serviceOptions.params || {}) };
        const deps = serviceOptions.dependsOn || [];
        deps.forEach((dep) => {
            const key = serviceOptions.paramMap?.[dep] || dep;
            params[key] = values?.[dep];
        });
        return params;
    };

    const mapToOptions = (serviceOptions: ServiceOptionsConfig, payload: any): Option[] => {
        if (serviceOptions.transform) {
            return serviceOptions.transform(payload);
        }

        const list = Array.isArray(payload) ? payload : payload?.data || [];
        const labelKey = serviceOptions.labelKey || 'label';
        const valueKey = serviceOptions.valueKey || 'value';

        return list
            .filter(Boolean)
            .map((item: any) => ({
                label: item[labelKey],
                value: item[valueKey],
            }));
    };

    useEffect(() => {
        if (serviceFields.length === 0) return;

        serviceFields.forEach((field) => {
            const serviceOptions = field.serviceOptions as ServiceOptionsConfig;
            const deps = serviceOptions.dependsOn || [];
            const depsMissing = deps.some((dep) => !hasValue(watchedValues?.[dep]));
            const shouldDisable = serviceOptions.disabledUntilDeps !== false ? depsMissing : false;

            setDisabledMap((prev) => (prev[field.name] === shouldDisable ? prev : { ...prev, [field.name]: shouldDisable }));

            if (depsMissing) {
                if (serviceOptions.clearOnMissingDeps !== false) {
                    setOptionsMap((prev) => ({ ...prev, [field.name]: [] }));
                    if (hasValue(watchedValues?.[field.name])) {
                        methods.setValue(field.name as any, undefined as any, { shouldDirty: true, shouldValidate: true });
                    }
                }
                return;
            }

            if (serviceOptions.autoLoad === false) return;

            const params = resolveParams(serviceOptions, watchedValues);
            const paramsKey = JSON.stringify(params || {});
            if (lastParamsRef.current[field.name] === paramsKey) return;
            lastParamsRef.current[field.name] = paramsKey;

            const fetchOptions = async () => {
                try {
                    const response =
                        serviceOptions.method === 'post'
                            ? await api.post(serviceOptions.endpoint, params)
                            : await api.get(serviceOptions.endpoint, { params });
                    const options = mapToOptions(serviceOptions, response.data);
                    setOptionsMap((prev) => ({ ...prev, [field.name]: options }));
                } catch (error) {
                    setOptionsMap((prev) => ({ ...prev, [field.name]: [] }));
                }
            };

            fetchOptions();
        });
    }, [serviceFields, watchedValues, methods]);

    const resolvedGridClassName = gridClassName || 'grid grid-cols-1 md:grid-cols-2 gap-5';

    const resolveColClass = (colSpan: number) => {
        if (resolvedGridClassName.includes('md:grid-cols-12')) {
            const colMap: Record<number, string> = {
                1: 'md:col-span-1',
                2: 'md:col-span-2',
                3: 'md:col-span-3',
                4: 'md:col-span-4',
                5: 'md:col-span-5',
                6: 'md:col-span-6',
                7: 'md:col-span-7',
                8: 'md:col-span-8',
                9: 'md:col-span-9',
                10: 'md:col-span-10',
                11: 'md:col-span-11',
                12: 'md:col-span-12',
            };
            return colMap[colSpan] || 'md:col-span-12';
        }

        if (resolvedGridClassName.includes('md:grid-cols-2')) {
            return colSpan >= 7 ? 'md:col-span-2' : 'md:col-span-1';
        }

        return 'md:col-span-1';
    };

    return (
        <FormProvider {...methods}>
            <form onSubmit={methods.handleSubmit(onSubmit)} className={clsx('space-y-6', formClassName)}>
                <div className={clsx(resolvedGridClassName)}>
                    {schema.map((field) => {
                        const colSpan = field.colSpan || 12; // Default to full width
                        const colClass = resolveColClass(colSpan);

                        const wrapperClassName = clsx(
                            colClass,
                            itemClassName || 'w-full',
                            field.wrapperClassName,
                            getItemClassName ? getItemClassName(field) : null
                        );

                        return (
                            <div key={field.name} className={wrapperClassName}>
                                <DynamicField
                                    field={field}
                                    optionsOverride={optionsMap[field.name]}
                                    disabled={disabledMap[field.name]}
                                />
                            </div>
                        );
                    })}
                </div>

                <div className="flex justify-end pt-2">
                    <Button
                        type="submit"
                        disabled={loading}
                        className="w-auto rounded-xl px-6"
                    >
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                        <span>{submitLabel}</span>
                    </Button>
                </div>
            </form>
        </FormProvider>
    );
};

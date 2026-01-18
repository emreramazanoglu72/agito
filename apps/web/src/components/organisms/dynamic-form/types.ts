import { Control, FieldValues, Path } from 'react-hook-form';

export type FieldType = 'text' | 'number' | 'email' | 'password' | 'date' | 'textarea' | 'checkbox' | 'select' | 'file-upload';

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

export interface Option {
    label: string;
    value: string | number;
}

export interface ServiceOptionsConfig {
    endpoint: string;
    method?: 'get' | 'post';
    params?: Record<string, any>;
    dependsOn?: string[];
    paramMap?: Record<string, string>;
    labelKey?: string;
    valueKey?: string;
    transform?: (data: any) => Option[];
    autoLoad?: boolean;
    clearOnMissingDeps?: boolean;
    disabledUntilDeps?: boolean;
}

export interface ValidationRules {
    required?: boolean | string;
    min?: number | { value: number; message: string };
    max?: number | { value: number; message: string };
    minLength?: number | { value: number; message: string };
    maxLength?: number | { value: number; message: string };
    pattern?: { value: RegExp; message: string };
    email?: boolean | string;
}

export interface FieldSchema {
    name: string;
    label: string;
    type: FieldType;
    placeholder?: string;
    options?: Option[]; // For select type
    serviceOptions?: ServiceOptionsConfig;
    uploadConfig?: UploadConfig; // For file-upload type
    validation?: ValidationRules;
    colSpan?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12; // Default grid column span
    wrapperClassName?: string; // Optional custom wrapper class
    props?: Record<string, any>; // Extra props for the PrimeReact component
    defaultValue?: any;
    required?: boolean; // Short-hand for validation.required
}

export interface DynamicFormProps<T extends FieldValues> {
    schema: FieldSchema[];
    onSubmit: (data: T) => void;
    defaultValues?: any;
    submitLabel?: string;
    loading?: boolean;
    formClassName?: string;
    gridClassName?: string;
    itemClassName?: string;
    getItemClassName?: (field: FieldSchema) => string;
}

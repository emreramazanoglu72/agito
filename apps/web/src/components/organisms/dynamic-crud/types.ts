import type { CSSProperties } from 'react';
import { FieldSchema } from '../dynamic-form/types';

export type FilterMatchMode = 'contains' | 'startsWith' | 'endsWith' | 'equals';

export type FilterMeta = Record<string, { value: string | null; matchMode?: FilterMatchMode }>;

export interface TableColumn {
    field: string;
    header: string;
    sortable?: boolean;
    filterable?: boolean;
    filterMatchMode?: FilterMatchMode;
    searchable?: boolean;
    filterPlaceholder?: string;
    style?: CSSProperties;
    body?: (rowData: any) => React.ReactNode;
}

export interface CrudTableConfig {
    columns: TableColumn[];
    globalSearch?: boolean;
    searchPlaceholder?: string;
    pageSize?: number;
    pageSizeOptions?: number[];
    emptyMessage?: string;
    serverSide?: boolean;
}

export interface CrudFormConfig {
    schema: FieldSchema[];
    // Future: layout, customization
    formClassName?: string;
    gridClassName?: string;
    itemClassName?: string;
    getItemClassName?: (field: FieldSchema) => string;
}

export interface CrudCardViewConfig<T> {
    renderCard: (row: T, helpers: { onEdit: (row: T) => void; onDelete: (row: T) => void }, index: number) => React.ReactNode;
    gridClassName?: string;
    emptyMessage?: string;
}

export interface CrudConfig<T> {
    title: string;
    description?: string;
    endpoint: string;
    primaryKey?: string;
    viewMode?: 'modal' | 'sidebar' | 'fullpage';
    listBehavior?: 'pagination' | 'infinite';
    table: CrudTableConfig;
    form: CrudFormConfig;
    cardView?: CrudCardViewConfig<T>;
    actions?: {
        enableEdit?: boolean;
        enableDelete?: boolean;
        header?: string;
        visibility?: (action: 'edit' | 'delete', row: T) => boolean;
    };
}

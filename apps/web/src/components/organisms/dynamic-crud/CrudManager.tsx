'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
    ColumnDef,
    ColumnFiltersState,
    OnChangeFn,
    SortingState,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
} from '@tanstack/react-table';
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Pencil, Plus, Search, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/components/ui/use-toast';
import { DynamicForm } from '../dynamic-form/DynamicForm';
import { UnifiedFormHeader } from '@/components/molecules/UnifiedFormHeader';
import { CrudConfig, FilterMatchMode, FilterMeta } from './types';
import { useDebounce } from '@/hooks/useDebounce';

interface CrudManagerProps<T> {
    config: CrudConfig<T>;
    data: T[];
    onSave: (data: T) => void;
    onDelete: (data: T) => void;
    loading?: boolean;
    totalRecords?: number;
    onQueryChange?: (query: {
        page: number;
        rows: number;
        sortField?: string;
        sortOrder?: 1 | -1 | 0 | null;
        filters: FilterMeta;
        globalFilter?: string;
    }) => void;
    hasMore?: boolean;
    loadingMore?: boolean;
    onLoadMore?: () => void;
}

export function CrudManager<T extends Record<string, any>>(props: CrudManagerProps<T>) {
    const {
        config,
        data,
        onSave,
        onDelete,
        loading,
        totalRecords,
        onQueryChange,
        hasMore,
        loadingMore,
        onLoadMore,
    } = props;
    type ColumnMeta = { style?: React.CSSProperties; filterPlaceholder?: string };
    const [formVisible, setFormVisible] = useState(false);
    const [selectedItem, setSelectedItem] = useState<T | null>(null);
    const [confirmItem, setConfirmItem] = useState<T | null>(null);
    const [formSubmitting, setFormSubmitting] = useState(false);
    const [isPageTransitioning, setIsPageTransitioning] = useState(false);
    const listRef = useRef<HTMLDivElement>(null);
    const hasPaginated = useRef(false);
    const { toast } = useToast();

    // Destructure config
    const { table, form, cardView, viewMode = 'modal', actions, listBehavior = 'pagination' } = config;
    const primaryKey = config.primaryKey || 'id';
    const globalSearchEnabled = table.globalSearch !== false;
    const pageSize = table.pageSize || 10;
    const pageSizeOptions = table.pageSizeOptions || [5, 10, 25];
    const emptyMessage = table.emptyMessage || 'Kayıt bulunamadı.';

    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [globalFilter, setGlobalFilter] = useState('');
    const [pagination, setPagination] = useState({ pageIndex: 0, pageSize });
    const infiniteMode = listBehavior === 'infinite';

    const debouncedGlobalFilter = useDebounce(globalFilter, 500);

    const handleGlobalFilterChange = (value: string) => {
        setGlobalFilter(value);
        setPagination((prev) => ({ ...prev, pageIndex: 0 }));
    };

    const handleColumnFiltersChange: OnChangeFn<ColumnFiltersState> = (updater) => {
        setColumnFilters((prev) => (typeof updater === 'function' ? updater(prev) : updater));
        setPagination((prev) => ({ ...prev, pageIndex: 0 }));
    };

    const matchValue = (value: unknown, filter: string, mode: FilterMatchMode) => {
        const haystack = String(value ?? '').toLowerCase();
        const needle = String(filter ?? '').toLowerCase();
        if (!needle) return true;
        switch (mode) {
            case 'startsWith':
                return haystack.startsWith(needle);
            case 'endsWith':
                return haystack.endsWith(needle);
            case 'equals':
                return haystack === needle;
            case 'contains':
            default:
                return haystack.includes(needle);
        }
    };

    const openNew = () => {
        setSelectedItem(null);
        setFormVisible(true);
    };

    const hideForm = () => {
        setFormVisible(false);
        setSelectedItem(null);
    };

    const editItem = (item: T) => {
        setSelectedItem({ ...item });
        setFormVisible(true);
    };

    const confirmDelete = (item: T) => {
        setConfirmItem(item);
    };

    const handleDeleteConfirm = async () => {
        if (!confirmItem) return;
        try {
            setFormSubmitting(true);
            await Promise.resolve(onDelete(confirmItem));
            toast({ title: 'Başarılı', description: 'Kayıt silindi' });
        } catch (error: any) {
            toast({ title: 'Hata', description: error?.message || 'Silme işlemi başarısız' });
        } finally {
            setFormSubmitting(false);
            setConfirmItem(null);
        }
    };

    const handleFormSubmit = async (formData: T) => {
        const itemToSave = selectedItem ? { ...selectedItem, ...formData } : formData;
        try {
            setFormSubmitting(true);
            await Promise.resolve(onSave(itemToSave));
            toast({ title: 'Başarılı', description: 'Kayıt kaydedildi' });
            hideForm();
        } catch (error: any) {
            toast({ title: 'Hata', description: error?.message || 'Kayıt kaydedilemedi' });
        } finally {
            setFormSubmitting(false);
        }
    };

    const actionBodyTemplate = (rowData: T) => {
        const showEdit = actions?.enableEdit !== false && (!actions?.visibility || actions.visibility('edit', rowData));
        const showDelete = actions?.enableDelete !== false && (!actions?.visibility || actions.visibility('delete', rowData));

        if (!showEdit && !showDelete) return null;

        return (
            <div className="flex justify-end gap-2">
                {showEdit && (
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => editItem(rowData)}
                        disabled={formSubmitting}
                        aria-label="Düzenle"
                    >
                        <Pencil className="h-4 w-4" />
                    </Button>
                )}
                {showDelete && (
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => confirmDelete(rowData)}
                        disabled={formSubmitting}
                        aria-label="Sil"
                    >
                        <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                )}
            </div>
        );
    };

    const columns = useMemo<ColumnDef<T>[]>(() => {
        const baseColumns = table.columns.map((col) => ({
            id: col.field,
            accessorKey: col.field,
            header: col.header,
            cell: (info: any) => (col.body ? col.body(info.row.original) : String(info.getValue() ?? '')),
            enableSorting: col.sortable !== false,
            enableColumnFilter: col.filterable !== false,
            enableGlobalFilter: col.searchable !== false,
            filterFn: (row: any, columnId: string, filterValue: string) =>
                matchValue(row.getValue(columnId), filterValue, col.filterMatchMode || 'contains'),
            meta: { style: col.style, filterPlaceholder: col.filterPlaceholder } as ColumnMeta
        }));

        if (actions?.enableEdit !== false || actions?.enableDelete !== false) {
            baseColumns.push({
                id: '__crud_actions',
                header: actions?.header || '',
                cell: (info: any) => actionBodyTemplate(info.row.original),
                enableSorting: false,
                enableColumnFilter: false,
            } as any);
        }

        return baseColumns;
    }, [table.columns, actions, formSubmitting]);

    const tableInstance = useReactTable({
        data,
        columns,
        state: {
            sorting,
            columnFilters,
            globalFilter,
            pagination,
        },
        onSortingChange: setSorting,
        onColumnFiltersChange: handleColumnFiltersChange,
        onGlobalFilterChange: handleGlobalFilterChange,
        onPaginationChange: setPagination,
        globalFilterFn: (row, columnId, filterValue) =>
            matchValue(row.getValue(columnId), String(filterValue ?? ''), 'contains'),
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: table.serverSide ? undefined : getFilteredRowModel(),
        getSortedRowModel: table.serverSide ? undefined : getSortedRowModel(),
        getPaginationRowModel: table.serverSide ? undefined : getPaginationRowModel(),
        manualSorting: !!table.serverSide,
        manualFiltering: !!table.serverSide,
        manualPagination: !!table.serverSide,
        pageCount: table.serverSide && totalRecords ? Math.ceil(totalRecords / pagination.pageSize) : undefined,
        enableGlobalFilter: globalSearchEnabled,
        getRowId: (row: any, index) => String(row?.[primaryKey] ?? index)
    });

    useEffect(() => {
        if (!table.serverSide || !onQueryChange) return;
        const sort = sorting[0];
        const filtersMeta = columnFilters.reduce<FilterMeta>((acc, filter) => {
            const columnConfig = table.columns.find((col) => col.field === filter.id);
            acc[filter.id] = {
                value: filter.value ? String(filter.value) : null,
                matchMode: columnConfig?.filterMatchMode || 'contains'
            };
            return acc;
        }, {});

        onQueryChange({
            page: pagination.pageIndex + 1,
            rows: pagination.pageSize,
            sortField: sort?.id,
            sortOrder: sort ? (sort.desc ? -1 : 1) : null,
            filters: filtersMeta,
            globalFilter: debouncedGlobalFilter || undefined,
        });
    }, [table.serverSide, onQueryChange, sorting, columnFilters, pagination, debouncedGlobalFilter, table.columns]);

    useEffect(() => {
        if (!hasPaginated.current) {
            hasPaginated.current = true;
            return;
        }
        setIsPageTransitioning(true);
        const raf = requestAnimationFrame(() => setIsPageTransitioning(false));
        listRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return () => cancelAnimationFrame(raf);
    }, [pagination.pageIndex, pagination.pageSize]);

    const formHeader = (
        <UnifiedFormHeader
            title={selectedItem ? "Kaydı Düzenle" : "Yeni Kayıt"}
            subtitle="Kayıt Modülü"
            badgeText={selectedItem ? 'Canlı düzenleme' : 'Yeni kayıt'}
            onClose={hideForm}
            mode={viewMode === 'sidebar' ? 'sheet' : viewMode === 'fullpage' ? 'inline' : 'dialog'}
        />
    );

    const formBody = (
        <div className="mx-auto max-w-3xl px-3 sm:px-6 py-6 bg-gradient-to-b from-white via-white to-slate-50">
            <DynamicForm
                schema={form.schema}
                onSubmit={handleFormSubmit}
                defaultValues={selectedItem || undefined}
                submitLabel="Kaydet"
                loading={formSubmitting}
                formClassName={form.formClassName}
                gridClassName={form.gridClassName}
                itemClassName={form.itemClassName}
                getItemClassName={form.getItemClassName}
            />
        </div>
    );

    const totalRows = table.serverSide ? (totalRecords || 0) : tableInstance.getFilteredRowModel().rows.length;
    const pageStart = totalRows === 0 ? 0 : pagination.pageIndex * pagination.pageSize + 1;
    const pageEnd = Math.min(totalRows, (pagination.pageIndex + 1) * pagination.pageSize);
    const hasColumnFilters = table.columns.some((col) => col.filterable !== false);
    const cardHelpers = { onEdit: editItem, onDelete: confirmDelete };

    // Infinite scroll can be triggered manually via "load more" button to avoid aggressive auto-fetch loops.

    // Fullpage View
    if (viewMode === 'fullpage' && formVisible) {
        return (
            <div className="min-h-screen p-4">
                <div className="app-card rounded-[28px] p-0 overflow-hidden">
                    {formHeader}
                    <div className="p-6">
                        {formBody}
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div>
            <AlertDialog open={Boolean(confirmItem)} onOpenChange={(open) => !open && setConfirmItem(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Kaydı silmek istiyor musunuz?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Bu işlem geri alınamaz. Seçili kayıt kalıcı olarak silinecek.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={formSubmitting}>Vazgeç</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteConfirm} disabled={formSubmitting}>
                            Sil
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <div className="app-card rounded-[24px] p-0 overflow-hidden border-none shadow-sm">
                {/* Header Section */}
                <div className="relative overflow-hidden border-b border-slate-100 bg-[radial-gradient(circle_at_top_left,_#0f172a,_#0b1220_55%,_#0b1322_100%)] p-5 sm:p-6 text-white">
                    <div className="absolute -left-16 -top-20 h-40 w-40 rounded-full bg-teal-400/20 blur-3xl"></div>
                    <div className="absolute -right-16 -bottom-20 h-48 w-48 rounded-full bg-indigo-400/20 blur-3xl"></div>
                    <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-white shadow-lg shadow-teal-500/10">
                                <Pencil className="h-5 w-5" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] font-semibold uppercase tracking-[0.4em] text-white/60">Operasyon Modülü</span>
                                <h2 className="m-0 text-2xl font-semibold tracking-tight">{config.title}</h2>
                                {config.description && <span className="text-sm text-white/70 mt-1">{config.description}</span>}
                            </div>
                        </div>

                        <div className="flex w-full flex-wrap items-center gap-3 rounded-2xl bg-white/90 px-3 py-2 text-slate-700 shadow-lg shadow-slate-900/10 sm:w-auto">
                            <div className="hidden sm:flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-500">
                                <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
                                {totalRows} kayıt
                            </div>
                            {globalSearchEnabled && (
                                <span className="relative w-full sm:w-auto">
                                    <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                    <Input
                                        value={globalFilter}
                                        onChange={(event) => handleGlobalFilterChange(event.target.value)}
                                        placeholder={table.searchPlaceholder || 'Tabloda ara...'}
                                        className="w-full min-w-0 rounded-xl border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm transition-all focus:bg-white focus-visible:border-teal-500 focus-visible:ring-4 focus-visible:ring-teal-500/10 sm:w-64"
                                    />
                                </span>
                            )}
                            <Button
                                className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-slate-200 hover:bg-slate-800 transition-all"
                                onClick={openNew}
                                disabled={formSubmitting}
                            >
                                <Plus className="h-4 w-4" />
                                Yeni Ekle
                            </Button>
                        </div>
                    </div>
                </div>

                {/* List Section */}
                {!cardView ? (
                    <>
                        <div
                            ref={listRef}
                            className={`p-0 bg-white/20 backdrop-blur-sm transition-all duration-300 ease-out ${isPageTransitioning ? 'opacity-0 -translate-y-2' : 'opacity-100 translate-y-0'}`}
                        >
                            <Table>
                                <TableHeader>
                                    {tableInstance.getHeaderGroups().map((headerGroup) => (
                                        <TableRow key={headerGroup.id} className="bg-slate-50/80">
                                            {headerGroup.headers.map((header) => {
                                                const canSort = header.column.getCanSort();
                                                const meta = header.column.columnDef.meta as ColumnMeta | undefined;
                                                return (
                                                    <TableHead key={header.id} style={meta?.style}>
                                                        {header.isPlaceholder ? null : canSort ? (
                                                            <button
                                                                type="button"
                                                                onClick={header.column.getToggleSortingHandler()}
                                                                className="inline-flex items-center gap-2 text-slate-600"
                                                            >
                                                                {flexRender(header.column.columnDef.header, header.getContext())}
                                                                {header.column.getIsSorted() === 'asc' && <ArrowUp className="h-3.5 w-3.5" />}
                                                                {header.column.getIsSorted() === 'desc' && <ArrowDown className="h-3.5 w-3.5" />}
                                                            </button>
                                                        ) : (
                                                            flexRender(header.column.columnDef.header, header.getContext())
                                                        )}
                                                    </TableHead>
                                                );
                                            })}
                                        </TableRow>
                                    ))}
                                    {hasColumnFilters && (
                                        <TableRow className="bg-white/80">
                                            {tableInstance.getHeaderGroups()[0]?.headers.map((header) => (
                                                <TableHead key={header.id} className="normal-case font-normal">
                                                    {header.column.getCanFilter() ? (
                                                        <Input
                                                            value={(header.column.getFilterValue() ?? '') as string}
                                                            onChange={(event) => header.column.setFilterValue(event.target.value)}
                                                            placeholder={(header.column.columnDef.meta as ColumnMeta | undefined)?.filterPlaceholder || 'Ara...'}
                                                            className="h-9 bg-white"
                                                        />
                                                    ) : null}
                                                </TableHead>
                                            ))}
                                        </TableRow>
                                    )}
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableRow>
                                            <TableCell colSpan={columns.length} className="py-10 text-center text-muted-foreground">
                                                Yükleniyor...
                                            </TableCell>
                                        </TableRow>
                                    ) : tableInstance.getRowModel().rows.length ? (
                                        tableInstance.getRowModel().rows.map((row) => (
                                            <TableRow key={row.id}>
                                                {row.getVisibleCells().map((cell) => (
                                                    <TableCell
                                                        key={cell.id}
                                                        style={(cell.column.columnDef.meta as ColumnMeta | undefined)?.style}
                                                        className={cell.column.id === '__crud_actions' ? 'text-right' : undefined}
                                                    >
                                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                    </TableCell>
                                                ))}
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={columns.length} className="py-10 text-center text-muted-foreground">
                                                {emptyMessage}
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                        {hasMore && infiniteMode && (
                            <div className="px-5 pb-4 pt-2 text-center">
                                <Button size="sm" variant="outline" onClick={() => onLoadMore?.()} disabled={loadingMore}>
                                    {loadingMore ? 'Yükleniyor...' : 'Daha fazla yükle'}
                                </Button>
                            </div>
                        )}
                    </>
                ) : (
                    <div
                        ref={listRef}
                        className={`p-5 transition-all duration-300 ease-out ${isPageTransitioning ? 'opacity-0 -translate-y-2' : 'opacity-100 translate-y-0'}`}
                    >
                        {loading ? (
                            <div className="rounded-2xl border border-slate-100 bg-white px-4 py-10 text-center text-slate-500 shadow-sm">
                                Yükleniyor...
                            </div>
                        ) : tableInstance.getRowModel().rows.length ? (
                            <div className={`grid gap-4 sm:grid-cols-2 xl:grid-cols-3 ${cardView.gridClassName || ''}`}>
                                {tableInstance.getRowModel().rows.map((row, idx) => (
                                    <React.Fragment key={row.id}>
                                        {cardView.renderCard(row.original as T, cardHelpers, idx)}
                                    </React.Fragment>
                                ))}
                                {infiniteMode && hasMore && (
                                    <div className="col-span-full flex justify-center">
                                        <Button size="sm" variant="outline" onClick={() => onLoadMore?.()} disabled={loadingMore}>
                                            {loadingMore ? 'Yükleniyor...' : 'Daha fazla yükle'}
                                        </Button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-8 text-center text-slate-500">
                                {cardView.emptyMessage || emptyMessage}
                            </div>
                        )}
                    </div>
                )}

                {/* Pagination */}
                {!infiniteMode && (
                    <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 text-sm text-muted-foreground">
                        <span>
                            {pageStart}-{pageEnd} / {totalRows}
                        </span>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => tableInstance.setPageIndex(0)}
                                disabled={!tableInstance.getCanPreviousPage()}
                            >
                                <ChevronsLeft className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => tableInstance.previousPage()}
                                disabled={!tableInstance.getCanPreviousPage()}
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => tableInstance.nextPage()}
                                disabled={!tableInstance.getCanNextPage()}
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => tableInstance.setPageIndex(tableInstance.getPageCount() - 1)}
                                disabled={!tableInstance.getCanNextPage()}
                            >
                                <ChevronsRight className="h-4 w-4" />
                            </Button>
                            <select
                                className="ml-2 rounded-lg border border-border bg-white px-2 py-1 text-sm"
                                value={pagination.pageSize}
                                onChange={(event) =>
                                    tableInstance.setPageSize(Number(event.target.value))
                                }
                            >
                                {pageSizeOptions.map((size) => (
                                    <option key={size} value={size}>
                                        {size} / sayfa
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal View */}
            {viewMode === 'modal' && (
                <Dialog open={formVisible} onOpenChange={(open) => !open && hideForm()}>
                    <DialogContent className="max-w-3xl p-0 bg-white" hideClose>
                        {formHeader}
                        {formBody}
                    </DialogContent>
                </Dialog>
            )}

            {/* Sidebar View */}
            {viewMode === 'sidebar' && (
                <Sheet open={formVisible} onOpenChange={(open) => !open && hideForm()}>
                    <SheetContent
                        side="right"
                        hideClose
                        className="w-[92vw] sm:w-[520px] lg:w-[40vw] max-w-[720px] p-0 border-l border-slate-200/70 bg-white"
                    >
                        {formHeader}
                        <div className="relative h-full bg-white overflow-y-auto pb-20">
                            {formBody}
                        </div>
                    </SheetContent>
                </Sheet>
            )}
        </div>
    );
}

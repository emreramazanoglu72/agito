import React from 'react';
import { Button } from '@/components/atoms/Button';
import { Download, Trash2, CheckSquare, Square } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Employee } from '@/types/employees';

interface BulkActionsToolbarProps {
    selectedIds: string[];
    onSelectAll: () => void;
    onClearSelection: () => void;
    totalCount: number;
    employees: Employee[];
}

export const BulkActionsToolbar: React.FC<BulkActionsToolbarProps> = ({
    selectedIds,
    onSelectAll,
    onClearSelection,
    totalCount,
    employees
}) => {
    const isAllSelected = selectedIds.length === totalCount && totalCount > 0;

    const handleExport = () => {
        const selectedEmployees = employees.filter(e => selectedIds.includes(e.id));
        const dataToExport = selectedEmployees.map(e => ({
            'Ad Soyad': e.fullName,
            'E-posta': e.email,
            'TC No': e.tcNo,
            'Departman': e.department?.name || '-',
            'Şirket': e.company?.name || '-',
            'Durum': e.status,
            'Aktif Poliçe': e.activePoliciesCount
        }));

        const ws = XLSX.utils.json_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Çalışanlar");
        XLSX.writeFile(wb, `calisanlar_disa_aktarim_${new Date().getTime()}.xlsx`);
    };

    if (selectedIds.length === 0) return null;

    return (
        <div className="fixed bottom-8 left-1/2 z-50 flex -translate-x-1/2 items-center gap-4 rounded-2xl bg-slate-900 px-6 py-4 text-white shadow-2xl shadow-slate-900/40 backdrop-blur-md">
            <div className="flex items-center gap-3 border-r border-slate-700 pr-6">
                <button
                    onClick={isAllSelected ? onClearSelection : onSelectAll}
                    className="flex h-5 w-5 items-center justify-center rounded border border-slate-600 transition-colors hover:border-teal-400"
                >
                    {isAllSelected ? (
                        <CheckSquare className="h-4 w-4 text-teal-400" />
                    ) : selectedIds.length > 0 ? (
                        <div className="h-2 w-2 rounded-sm bg-teal-400" />
                    ) : (
                        <Square className="h-4 w-4 text-slate-600" />
                    )}
                </button>
                <span className="text-sm font-medium">
                    {selectedIds.length} öğe seçildi
                </span>
            </div>

            <div className="flex items-center gap-2">
                <Button
                    variant="ghost"
                    size="sm"
                    className="text-white hover:bg-white/10"
                    onClick={handleExport}
                >
                    <Download className="mr-2 h-4 w-4" />
                    Excel'e Aktar
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    className="text-rose-400 hover:bg-rose-500/10 hover:text-rose-400"
                >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Sil
                </Button>
            </div>

            <button
                onClick={onClearSelection}
                className="ml-4 text-xs text-slate-400 transition-colors hover:text-white"
            >
                Vazgeç
            </button>
        </div>
    );
};

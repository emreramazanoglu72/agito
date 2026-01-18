import { create } from 'zustand';

interface BulkStore {
    activeStep: number;
    file: File | null;
    parsedData: any[];     // Raw data from Excel
    mappedData: any[];     // Data after column mapping
    columnMapping: Record<string, string>; // Excel Header -> Target Field
    fields: { label: string; value: string; required?: boolean }[]; // Expected Target Fields
    validationErrors: any[]; // Rows with errors
    isUploading: boolean;
    uploadProgress: number;

    setStep: (step: number) => void;
    setFile: (file: File | null) => void;
    setParsedData: (data: any[]) => void;
    setMappedData: (data: any[]) => void;
    setColumnMapping: (mapping: Record<string, string>) => void;
    setFields: (fields: { label: string; value: string; required?: boolean }[]) => void;
    setValidationErrors: (errors: any[]) => void;
    setIsUploading: (isUploading: boolean) => void;
    setUploadProgress: (progress: number) => void;
    reset: () => void;
}

export const useBulkStore = create<BulkStore>((set) => ({
    activeStep: 0,
    file: null,
    parsedData: [],
    mappedData: [],
    columnMapping: {},
    fields: [],
    validationErrors: [],
    isUploading: false,
    uploadProgress: 0,

    setStep: (step) => set({ activeStep: step }),
    setFile: (file) => set({ file }),
    setParsedData: (data) => set({ parsedData: data }),
    setMappedData: (data) => set({ mappedData: data }),
    setColumnMapping: (mapping) => set({ columnMapping: mapping }),
    setFields: (fields) => set({ fields }),
    setValidationErrors: (errors) => set({ validationErrors: errors }),
    setIsUploading: (isUploading) => set({ isUploading }),
    setUploadProgress: (progress) => set({ uploadProgress: progress }),
    reset: () => set({
        activeStep: 0,
        file: null,
        parsedData: [],
        mappedData: [],
        columnMapping: {},
        fields: [],
        validationErrors: [],
        isUploading: false,
        uploadProgress: 0
    })
}));

import { FieldSchema } from '@/components/organisms/dynamic-form/types';

export const documentUploadSchema: FieldSchema[] = [
    {
        name: 'files',
        label: 'Dökümanlar',
        type: 'file-upload',
        uploadConfig: {
            maxFiles: 5,
            maxSize: 10 * 1024 * 1024,
            accept: {
                'application/pdf': ['.pdf'],
                'image/*': ['.png', '.jpg', '.jpeg'],
                'application/msword': ['.doc'],
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
            },
            description: 'PDF, Word veya Resim dosyaları (Max 10MB)',
        },
        validation: { required: true },
        colSpan: 12
    }
];

export const employeeSchema: FieldSchema[] = [
    {
        name: 'avatarUrl',
        label: 'Profil Fotoğrafı',
        type: 'file-upload',
        uploadConfig: {
            variant: 'avatar',
            endpoint: '/employees/:id/upload',
            autoUpload: true,
            accept: { 'image/*': ['.png', '.jpg', '.jpeg'] },
            maxFiles: 1
        },
        colSpan: 12,
        validation: { required: false }
    },
    {
        name: 'firstName',
        label: 'Ad',
        type: 'text',
        validation: { required: true, min: 2 },
        colSpan: 6,
    },
    {
        name: 'lastName',
        label: 'Soyad',
        type: 'text',
        validation: { required: true, min: 2 },
        colSpan: 6,
    },
    {
        name: 'email',
        label: 'E-posta Adresi',
        type: 'email',
        validation: { required: true, email: true },
        colSpan: 6,
    },
    {
        name: 'phoneNumber',
        label: 'Telefon',
        type: 'text',
        validation: { required: false },
        colSpan: 6,
    },
    {
        name: 'tcNo',
        label: 'TC Kimlik No',
        type: 'text',
        validation: { required: true, min: 11, max: 11 },
        colSpan: 6,
    },
    {
        name: 'departmentId',
        label: 'Departman',
        type: 'select',
        serviceOptions: {
            endpoint: '/departments',
            labelKey: 'name',
            valueKey: 'id'
        },
        validation: { required: true },
        colSpan: 6,
    },
    {
        name: 'status',
        label: 'Durum',
        type: 'select',
        options: [
            { label: 'Aktif', value: 'ACTIVE' },
            { label: 'Beklemede', value: 'PENDING' },
            { label: 'Pasif', value: 'INACTIVE' },
        ],
        defaultValue: 'ACTIVE',
        colSpan: 6,
    }
];

export const policySchema: FieldSchema[] = [
    {
        name: 'policyNo',
        label: 'Poliçe No',
        type: 'text',
        validation: { required: true },
        colSpan: 6,
    },
    {
        name: 'type',
        label: 'Sigorta Türü',
        type: 'select',
        options: [
            { label: 'Tamamlayıcı Sağlık', value: 'TSS' },
            { label: 'Özel Sağlık', value: 'OSS' },
            { label: 'Hayat Sigortası', value: 'LIFE' },
            { label: 'Ferdi Kaza', value: 'FERDI_KAZA' },
        ],
        validation: { required: true },
        colSpan: 6,
    },
    {
        name: 'premium',
        label: 'Prim Tutarı (TL)',
        type: 'number',
        validation: { required: true, min: 0 },
        colSpan: 6,
    },
    {
        name: 'startDate',
        label: 'Başlangıç Tarihi',
        type: 'date',
        validation: { required: true },
        colSpan: 6,
    },
    {
        name: 'endDate',
        label: 'Bitiş Tarihi',
        type: 'date',
        validation: { required: true },
        colSpan: 6,
    },
    {
        name: 'status',
        label: 'Durum',
        type: 'select',
        options: [
            { label: 'Aktif', value: 'ACTIVE' },
            { label: 'Beklemede', value: 'PENDING_RENEWAL' },
            { label: 'İptal', value: 'CANCELLED' },
        ],
        defaultValue: 'ACTIVE',
        colSpan: 6,
    }
];

export const policyCreateSchema: FieldSchema[] = [
    {
        name: 'type',
        label: 'Sigorta Türü',
        type: 'select',
        options: [
            { label: 'Tamamlayıcı Sağlık', value: 'TSS' },
            { label: 'Özel Sağlık', value: 'OSS' },
            { label: 'Hayat Sigortası', value: 'LIFE' },
            { label: 'Ferdi Kaza', value: 'FERDI_KAZA' },
        ],
        validation: { required: true },
        colSpan: 6,
    },
    {
        name: 'startDate',
        label: 'Başlangıç Tarihi',
        type: 'date',
        validation: { required: true },
        colSpan: 6,
    },
    {
        name: 'endDate',
        label: 'Bitiş Tarihi',
        type: 'date',
        validation: { required: true },
        colSpan: 6,
    }
];

import React from 'react';

export const CompanyOverview = ({ company }: { company: any }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <i className="pi pi-info-circle text-blue-500"></i>
                    Temel Bilgiler
                </h3>
                <div className="space-y-4">
                    <div className="flex justify-between border-b border-gray-50 pb-2">
                        <span className="text-gray-500 text-sm">Vergi No</span>
                        <span className="font-medium text-gray-900">{company.taxId || '-'}</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-50 pb-2">
                        <span className="text-gray-500 text-sm">Vergi Dairesi</span>
                        <span className="font-medium text-gray-900">{company.taxOffice || '-'}</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-50 pb-2">
                        <span className="text-gray-500 text-sm">Kuruluş Yılı</span>
                        <span className="font-medium text-gray-900">{company.foundedYear || '2020'}</span>
                    </div>
                </div>
            </div>

            <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <i className="pi pi-phone text-green-500"></i>
                    İletişim
                </h3>
                <div className="space-y-4">
                    <div className="flex justify-between border-b border-gray-50 pb-2">
                        <span className="text-gray-500 text-sm">Adres</span>
                        <span className="font-medium text-gray-900 text-right max-w-[200px]">{company.address || '-'}</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-50 pb-2">
                        <span className="text-gray-500 text-sm">Telefon</span>
                        <span className="font-medium text-gray-900">{company.phone || '+90 (212) 555 0000'}</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-50 pb-2">
                        <span className="text-gray-500 text-sm">E-posta</span>
                        <span className="font-medium text-gray-900 text-blue-600">{company.email || 'info@company.com'}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

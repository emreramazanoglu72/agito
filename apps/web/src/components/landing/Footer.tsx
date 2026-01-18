import Link from 'next/link';
import React from 'react';

export const Footer = () => {
    return (
        <footer className="bg-white border-t border-slate-200 pt-16 pb-8">
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
                    <div className="col-span-2 md:col-span-1">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-white">
                                <i className="pi pi-bolt"></i>
                            </div>
                            <span className="font-bold text-slate-900">AgitoPortal</span>
                        </div>
                        <p className="text-sm text-slate-500 leading-relaxed">
                            Kurumsal sigortacılık süreçlerini dijitalleştiren, hızlandıran ve güvenli hale getiren yeni nesil platform.
                        </p>
                    </div>
                    <div>
                        <h4 className="font-bold text-slate-900 mb-4">Ürün</h4>
                        <ul className="space-y-2 text-sm text-slate-600">
                            <li><a href="#" className="hover:text-blue-600">Özellikler</a></li>
                            <li><a href="#" className="hover:text-blue-600">Paketler</a></li>
                            <li><a href="#" className="hover:text-blue-600">Güvenlik</a></li>
                            <li><a href="#" className="hover:text-blue-600">Yol Haritası</a></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-bold text-slate-900 mb-4">Şirket</h4>
                        <ul className="space-y-2 text-sm text-slate-600">
                            <li><a href="#" className="hover:text-blue-600">Hakkımızda</a></li>
                            <li><a href="#" className="hover:text-blue-600">Kariyer</a></li>
                            <li><a href="#" className="hover:text-blue-600">Blog</a></li>
                            <li><a href="#" className="hover:text-blue-600">İletişim</a></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-bold text-slate-900 mb-4">Yasal</h4>
                        <ul className="space-y-2 text-sm text-slate-600">
                            <li><Link href="/privacy" className="hover:text-blue-600">Gizlilik Politikası</Link></li>
                            <li><Link href="/terms" className="hover:text-blue-600">Kullanım Şartları</Link></li>
                            <li><a href="#" className="hover:text-blue-600">KVKK</a></li>
                        </ul>
                    </div>
                </div>
                <div className="border-t border-slate-100 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-xs text-slate-400">© 2024 Agito Software. Tüm hakları saklıdır.</p>
                    <div className="flex gap-4 text-slate-400">
                        <i className="pi pi-twitter hover:text-slate-600 cursor-pointer"></i>
                        <i className="pi pi-linkedin hover:text-blue-700 cursor-pointer"></i>
                        <i className="pi pi-github hover:text-slate-900 cursor-pointer"></i>
                    </div>
                </div>
            </div>
        </footer>
    );
};

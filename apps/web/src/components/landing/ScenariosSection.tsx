import React from 'react';

export const ScenariosSection = () => {
    return (
        <section id="scenarios" className="py-24 bg-white overflow-hidden">
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
                <div className="text-center mb-20">
                    <h2 className="text-3xl font-extrabold text-slate-900 sm:text-4xl">Gerçek Kullanım Senaryoları</h2>
                    <p className="mt-4 text-lg text-slate-600">Her departman için özelleştirilmiş iş akışları.</p>
                </div>

                <div className="space-y-32">
                    {/* Scenario 1: HR Onboarding */}
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        <div>
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 text-purple-700 text-xs font-bold mb-6">
                                <i className="pi pi-users"></i> İnsan Kaynakları
                            </div>
                            <h3 className="text-3xl font-bold text-slate-900 mb-6">Tek Tıkla Toplu Personel Girişi</h3>
                            <p className="text-lg text-slate-600 leading-relaxed mb-8">
                                Yüzlerce çalışanı tek tek girmekle uğraşmayın. Excel listenizi yükleyin, sistem otomatik olarak:
                            </p>
                            <ul className="space-y-4 mb-8">
                                <li className="flex items-start gap-3">
                                    <div className="h-6 w-6 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 shrink-0 mt-0.5"><i className="pi pi-check text-xs"></i></div>
                                    <span className="text-slate-700">Çalışan kartlarını oluşturur</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <div className="h-6 w-6 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 shrink-0 mt-0.5"><i className="pi pi-check text-xs"></i></div>
                                    <span className="text-slate-700">Departmanlarına atar</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <div className="h-6 w-6 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 shrink-0 mt-0.5"><i className="pi pi-check text-xs"></i></div>
                                    <span className="text-slate-700">Uygun poliçe tipini tanımlar</span>
                                </li>
                            </ul>
                            <div className="p-4 bg-purple-50 rounded-xl border border-purple-100 text-purple-800 text-sm font-medium">
                                "Geçen ay 50 kişilik yeni alım yaptık, tüm girişler 2 dakikada bitti." — <span className="font-bold">HR Direktörü, TechCorp</span>
                            </div>
                        </div>
                        {/* Mockup UI */}
                        <div className="relative group">
                            <div className="absolute -inset-2 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-2xl blur-xl opacity-20 group-hover:opacity-40 transition duration-500"></div>
                            <div className="relative bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden">
                                {/* Fake Browser Header */}
                                <div className="h-10 bg-slate-50 border-b border-slate-200 flex items-center px-4 gap-2">
                                    <div className="h-3 w-3 rounded-full bg-red-400"></div>
                                    <div className="h-3 w-3 rounded-full bg-amber-400"></div>
                                    <div className="h-3 w-3 rounded-full bg-green-400"></div>
                                    <div className="ml-4 flex-1 h-6 bg-white rounded-md border border-slate-200 flex items-center px-2 text-[10px] text-slate-400">agito.com/employees/import</div>
                                </div>
                                {/* Content */}
                                <div className="p-6">
                                    <div className="flex justify-between items-center mb-6">
                                        <h4 className="font-bold text-slate-900">Toplu Yükleme Önizleme</h4>
                                        <div className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">✓ Dosya Ayrıştırıldı</div>
                                    </div>
                                    <div className="space-y-3">
                                        {[1, 2, 3].map(i => (
                                            <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-8 w-8 rounded-full bg-slate-200"></div>
                                                    <div>
                                                        <div className="h-3 w-24 bg-slate-300 rounded mb-1"></div>
                                                        <div className="h-2 w-16 bg-slate-200 rounded"></div>
                                                    </div>
                                                </div>
                                                <div className="h-4 w-4 rounded bg-green-500"></div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="mt-6 flex gap-3">
                                        <div className="flex-1 py-2 bg-slate-900 text-white text-center rounded-lg text-sm font-bold shadow-lg">Onayla ve Yükle (354 Kişi)</div>
                                    </div>
                                </div>
                            </div>
                            {/* Floating Toast */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-slate-900/90 backdrop-blur text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-2 animate-bounce">
                                <i className="pi pi-check-circle text-green-400"></i>
                                <span className="text-sm font-bold">İşlem Tamamlandı</span>
                            </div>
                        </div>
                    </div>

                    {/* Scenario 2: Finance */}
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        {/* Mockup UI (Left side on desktop) */}
                        <div className="relative group order-2 lg:order-1">
                            <div className="absolute -inset-2 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl blur-xl opacity-20 group-hover:opacity-40 transition duration-500"></div>
                            <div className="relative bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden p-6">
                                <div className="flex justify-between items-end mb-8">
                                    <div>
                                        <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Toplam Tahsilat</p>
                                        <h4 className="text-4xl font-extrabold text-slate-900 mt-1">₺2.450.000</h4>
                                        <span className="text-xs text-green-600 font-bold flex items-center gap-1 mt-1"><i className="pi pi-arrow-up"></i> %12 artış</span>
                                    </div>
                                    <div className="h-10 w-32 bg-slate-100 rounded-lg"></div>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-4 rounded-xl border border-red-100 bg-red-50/50">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center text-red-600"><i className="pi pi-exclamation-triangle"></i></div>
                                            <div>
                                                <p className="font-bold text-slate-900">Gecikmiş Ödemeler</p>
                                                <p className="text-xs text-red-600">3 Şirket - 45 Gün</p>
                                            </div>
                                        </div>
                                        <button className="px-4 py-2 bg-white border border-red-200 text-red-600 text-xs font-bold rounded-lg shadow-sm hover:bg-red-50">Hatırlat</button>
                                    </div>
                                    <div className="flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-white">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center text-green-600"><i className="pi pi-wallet"></i></div>
                                            <div>
                                                <p className="font-bold text-slate-900">Gelecek Tahsilatlar</p>
                                                <p className="text-xs text-slate-500">Bu hafta: ₺120.000</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="order-1 lg:order-2">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold mb-6">
                                <i className="pi pi-wallet"></i> Finans & Muhasebe
                            </div>
                            <h3 className="text-3xl font-bold text-slate-900 mb-6">Nakit Akışını Güvenceye Alın</h3>
                            <p className="text-lg text-slate-600 leading-relaxed mb-8">
                                Hangi poliçenin ödemesi geldi, hangisi gecikti anlık olarak takip edin.
                                Sistem otomatik bildirimlerle tahsilat süreçlerini hızlandırır.
                            </p>
                            <ul className="space-y-4 mb-8">
                                <li className="flex items-start gap-3">
                                    <div className="h-6 w-6 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0 mt-0.5"><i className="pi pi-check text-xs"></i></div>
                                    <span className="text-slate-700">Otomatik ödeme hatırlatıcıları (E-posta/SMS)</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <div className="h-6 w-6 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0 mt-0.5"><i className="pi pi-check text-xs"></i></div>
                                    <span className="text-slate-700">Şirket bazlı borç/alacak raporları</span>
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* Scenario 3: Operations (Renewal) */}
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        <div>
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold mb-6">
                                <i className="pi pi-cog"></i> Operasyon
                            </div>
                            <h3 className="text-3xl font-bold text-slate-900 mb-6">Akıllı Yenileme Yönetimi</h3>
                            <p className="text-lg text-slate-600 leading-relaxed mb-8">
                                Vadesi dolan poliçeleri kaçırmayın. Sistem, bitiş tarihine 30 gün kala size
                                <strong> "Akıllı Teklif"</strong> sunar. Önceki yılın hasar/prim oranına göre optimize edilmiş fiyatı tek tıkla onaylayın.
                            </p>
                            <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 text-blue-800 text-sm font-medium">
                                🚀 Yenileme oranlarında %40 artış sağlandı.
                            </div>
                        </div>
                        {/* Mockup UI */}
                        <div className="relative group">
                            <div className="absolute -inset-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl blur-xl opacity-20 group-hover:opacity-40 transition duration-500"></div>
                            <div className="relative bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden p-8">
                                <div className="flex items-start justify-between mb-6">
                                    <div className="flex gap-4">
                                        <div className="h-12 w-12 rounded-xl bg-slate-100 flex items-center justify-center"><i className="pi pi-file text-2xl text-slate-600"></i></div>
                                        <div>
                                            <h4 className="font-bold text-slate-900 text-lg">TSS Poliçesi #4829</h4>
                                            <p className="text-sm text-slate-500">Ahmet Yılmaz - Yazılım Dept.</p>
                                        </div>
                                    </div>
                                    <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-lg text-xs font-bold">Süresi Doluyor</span>
                                </div>
                                <div className="border-t border-b border-slate-100 py-6 mb-6">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-sm text-slate-500">Geçen Yıl</span>
                                        <span className="font-semibold text-slate-400 line-through">₺4.500</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-bold text-slate-900">Yeni Teklif</span>
                                        <span className="text-2xl font-bold text-blue-600">₺5.250</span>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <button className="py-3 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50">Reddet</button>
                                    <button className="py-3 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 shadow-lg shadow-blue-600/20">Yenilemeyi Onayla</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

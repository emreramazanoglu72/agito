import React from 'react';

export const FeaturesSection = () => {
    return (
        <section id="features" className="py-24 bg-slate-50 relative border-y border-slate-200">
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
                <div className="mx-auto max-w-2xl text-center mb-16">
                    <h2 className="text-base font-semibold leading-7 text-blue-600">Üstün Teknoloji</h2>
                    <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                        İhtiyacınız Olan Her Şey
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    {/* Feature 1 */}
                    <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200/60 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                        <div className="h-12 w-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 mb-6">
                            <i className="pi pi-sync text-xl"></i>
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mb-3">Merkezi Yönetim</h3>
                        <p className="text-slate-600 text-sm leading-relaxed">
                            Şirket, departman ve çalışan hiyerarşisini tek bir yerden yönetin.
                            Değişiklikler anlık olarak tüm poliçelere yansır.
                        </p>
                    </div>
                    {/* Feature 2 */}
                    <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200/60 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                        <div className="h-12 w-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 mb-6">
                            <i className="pi pi-search text-xl"></i>
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mb-3">Akıllı Arama</h3>
                        <p className="text-slate-600 text-sm leading-relaxed">
                            Elasticsearch altyapısı ile milyonlarca kayıt arasında saniyeler içinde
                            fuzzy search (hatalı yazım toleranslı) arama yapın.
                        </p>
                    </div>
                    {/* Feature 3 */}
                    <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200/60 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                        <div className="h-12 w-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 mb-6">
                            <i className="pi pi-shield text-xl"></i>
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mb-3">Güvenli Arşiv</h3>
                        <p className="text-slate-600 text-sm leading-relaxed">
                            Poliçeleriniz ve hassas dokümanlarınız Cloudflare R2 üzerinde
                            KVKK uyumlu ve şifreli olarak saklanır.
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
};

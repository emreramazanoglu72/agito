
export const HeroSection = () => {
    return (
        <div className="relative isolate pt-32 pb-20 lg:pt-40 lg:pb-32 overflow-hidden bg-white">
            <div className="mx-auto max-w-7xl px-6 lg:px-8 relative z-10 text-center">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-xs font-semibold mb-8">
                    <span className="flex h-2 w-2 rounded-full bg-blue-600"></span>
                    v2.4.0 Yayında: Yeni Kurumsal Paketler
                </div>

                <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-slate-900 mb-8 leading-tight">
                    Sigorta Yönetiminde <br />
                    <span className="text-blue-700">Geleceğin Standartı</span>
                </h1>

                <p className="mt-6 text-lg leading-8 text-slate-600 max-w-2xl mx-auto">
                    Agito Portal, karmaşık B2B sigorta süreçlerini, poliçe yönetimini ve finansal mutabakatları
                    tek bir merkezi platformda birleştirerek operasyonel mükemmelliği hedefler.
                </p>

                <div className="mt-10 flex items-center justify-center gap-x-6">
                    <a href="#pricing" className="rounded-md bg-blue-700 px-8 py-4 text-sm font-semibold text-white shadow-sm hover:bg-blue-800 transition-all duration-200">
                        Hemen Başvur
                    </a>
                    <a href="#scenarios" className="text-sm font-semibold leading-6 text-slate-900 flex items-center gap-2 hover:gap-3 transition-all group">
                        Senaryoları İncele <span aria-hidden="true" className="group-hover:translate-x-1 transition-transform">→</span>
                    </a>
                </div>

                {/* Trusted By Strip */}
                <div className="mt-24 pt-10 border-t border-slate-100">
                    <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-8">GÜVENİLİR İŞ ORTAKLARIMIZ</p>
                    <div className="flex flex-wrap justify-center gap-8 md:gap-16 opacity-40 grayscale hover:grayscale-0 transition-all duration-500">
                        <div className="flex items-center gap-2 font-bold text-xl"><i className="pi pi-apple text-2xl"></i> ACME Corp</div>
                        <div className="flex items-center gap-2 font-bold text-xl"><i className="pi pi-google text-2xl"></i> Global Ins.</div>
                        <div className="flex items-center gap-2 font-bold text-xl"><i className="pi pi-microsoft text-2xl"></i> TechSure</div>
                        <div className="flex items-center gap-2 font-bold text-xl"><i className="pi pi-amazon text-2xl"></i> PrimeLife</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

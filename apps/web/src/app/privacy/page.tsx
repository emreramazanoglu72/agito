import Link from 'next/link';

export default function PrivacyPolicy() {
    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
            {/* Navbar */}
            <nav className="fixed top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-slate-200/50 shadow-sm">
                <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 lg:px-8">
                    <Link href="/" className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white">
                            <i className="pi pi-bolt text-lg"></i>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xl font-bold tracking-tight text-slate-900 leading-none">Agito<span className="text-blue-600">Portal</span></span>
                        </div>
                    </Link>
                </div>
            </nav>

            <main className="pt-32 pb-20 px-6">
                <div className="mx-auto max-w-3xl bg-white p-10 rounded-3xl shadow-sm border border-slate-200">
                    <h1 className="text-3xl font-bold text-slate-900 mb-8 pb-4 border-b border-slate-100">Gizlilik Politikası</h1>

                    <div className="prose prose-slate max-w-none text-slate-600">
                        <p className="mb-4">Son Güncelleme: 18 Ocak 2026</p>

                        <h3 className="text-lg font-bold text-slate-900 mt-6 mb-3">1. Veri Toplama</h3>
                        <p className="mb-4">
                            Agito Portal hizmetlerini kullanırken, sizden belirli kişisel bilgileri (ad, e-posta adresi, telefon numarası vb.) talep edebiliriz.
                            Bu bilgiler, hizmet kalitemizi artırmak ve yasal yükümlülüklerimizi yerine getirmek amacıyla toplanmaktadır.
                        </p>

                        <h3 className="text-lg font-bold text-slate-900 mt-6 mb-3">2. Veri Kullanımı</h3>
                        <p className="mb-4">Toplanan veriler şu amaçlarla kullanılır:</p>
                        <ul className="list-disc pl-5 mb-4 space-y-1">
                            <li>Poliçe teklif ve tanzim süreçlerinin yürütülmesi</li>
                            <li>Müşteri hizmetleri ve destek faaliyetleri</li>
                            <li>Yasal bildirimler ve güncellemeler</li>
                            <li>Hizmet iyileştirme ve analiz çalışmaları</li>
                        </ul>

                        <h3 className="text-lg font-bold text-slate-900 mt-6 mb-3">3. Veri Güvenliği</h3>
                        <p className="mb-4">
                            Verileriniz, endüstri standardı şifreleme yöntemleri (SSL/TLS) ile korunmaktadır.
                            Kişisel verileriniz, yasal zorunluluklar haricinde üçüncü taraflarla paylaşılmaz.
                        </p>

                        <h3 className="text-lg font-bold text-slate-900 mt-6 mb-3">4. İletişim</h3>
                        <p>
                            Gizlilik politikamızla ilgili sorularınız için <a href="mailto:privacy@agito.com" className="text-blue-600 hover:underline">privacy@agito.com</a> adresinden bize ulaşabilirsiniz.
                        </p>
                    </div>
                </div>
            </main>
        </div>
    );
}

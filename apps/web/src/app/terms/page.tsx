import Link from 'next/link';

export default function TermsOfService() {
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
                    <h1 className="text-3xl font-bold text-slate-900 mb-8 pb-4 border-b border-slate-100">Kullanım Şartları</h1>

                    <div className="prose prose-slate max-w-none text-slate-600">
                        <p className="mb-4">Son Güncelleme: 18 Ocak 2026</p>

                        <h3 className="text-lg font-bold text-slate-900 mt-6 mb-3">1. Hizmet Kabulü</h3>
                        <p className="mb-4">
                            Agito Portal'ı kullanarak, bu kullanım şartlarını kabul etmiş sayılırsınız. Şartları kabul etmiyorsanız lütfen hizmeti kullanmayınız.
                        </p>

                        <h3 className="text-lg font-bold text-slate-900 mt-6 mb-3">2. Hesap Güvenliği</h3>
                        <p className="mb-4">
                            Kullanıcı hesabınızın güvenliğini sağlamak sizin sorumluluğunuzdadır. Şifrenizi kimseyle paylaşmamalı ve hesabınızda şüpheli bir işlem fark ederseniz derhal bize bildirmelisiniz.
                        </p>

                        <h3 className="text-lg font-bold text-slate-900 mt-6 mb-3">3. Fikri Mülkiyet</h3>
                        <p className="mb-4">
                            Bu web sitesindeki tüm içerik, logolar, yazılımlar ve tasarımlar Agito Software'in mülkiyetindedir ve telif hakkı yasalarıyla korunmaktadır.
                        </p>

                        <h3 className="text-lg font-bold text-slate-900 mt-6 mb-3">4. Sorumluluk Reddi</h3>
                        <p className="mb-4">
                            Hizmetlerimiz "olduğu gibi" sunulmaktadır. Agito Software, sistemin kesintisiz veya hatasız çalışacağını garanti etmez. Doğrudan veya dolaylı oluşabilecek zararlardan sorumlu tutulamaz.
                        </p>

                        <h3 className="text-lg font-bold text-slate-900 mt-6 mb-3">5. Değişiklik Hakkı</h3>
                        <p>
                            Agito, bu şartları önceden bildirmeksizin değiştirme hakkını saklı tutar. Değişiklikler yayınlandığı tarihte yürürlüğe girer.
                        </p>
                    </div>
                </div>
            </main>
        </div>
    );
}

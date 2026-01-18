import Link from 'next/link';
import React from 'react';

export const Navbar = () => {
    return (
        <nav className="fixed top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-slate-200/50 shadow-sm transition-all">
            <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 lg:px-8">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-lg shadow-slate-900/20 ring-1 ring-slate-900/5">
                        <i className="pi pi-bolt text-lg"></i>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-xl font-bold tracking-tight text-slate-900 leading-none">Agito<span className="text-blue-600">Portal</span></span>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-0.5">Enterprise Edition</span>
                    </div>
                </div>
                <div className="hidden md:flex items-center gap-8">
                    <Link href="#scenarios" className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors">Senaryolar</Link>
                    <Link href="#features" className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors">Özellikler</Link>
                    <Link href="#pricing" className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors">Paketler</Link>
                    <div className="h-6 w-px bg-slate-200"></div>
                    <Link
                        href={process.env.NEXT_PUBLIC_AUTH_URL || 'http://localhost:3001/auth/login'}
                        className="rounded-full bg-slate-900 px-6 py-2.5 text-sm font-bold text-white transition-all hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-900/20 active:scale-95"
                    >
                        Portala Giriş
                    </Link>
                </div>
            </div>
        </nav>
    );
};

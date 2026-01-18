'use client';

import React, { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { clsx } from 'clsx';
import { api } from '../../lib/api';
import { clearSessionCookie } from '../../lib/session';
import { useAuthStore } from '../../store/useAuthStore';
import { useUser } from '@/hooks/queries/useAuth';

type UserRole = 'ADMIN' | 'HR_MANAGER' | 'EMPLOYEE';

interface TopbarProps {
    onToggleSidebar?: () => void;
    isSidebarOpen?: boolean;
}

export const Topbar = ({ onToggleSidebar, isSidebarOpen }: TopbarProps) => {
    const router = useRouter();
    const pathname = usePathname();

    const { role: userRole, name: userName, avatar: userAvatar, logout } = useAuthStore();
    const { data: user, isLoading } = useUser();

    // Fallback to store values if query is loading or error, otherwise use fresh data
    const activeRole = user?.role || userRole || 'EMPLOYEE';
    const activeName = user?.fullName || userName;
    const activeAvatar = user?.avatarUrl || userAvatar;

    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [isPolicyMenuOpen, setIsPolicyMenuOpen] = useState(false);
    const [isCompanyMenuOpen, setIsCompanyMenuOpen] = useState(false);
    const [isDocumentMenuOpen, setIsDocumentMenuOpen] = useState(false);
    const userMenuRef = useRef<HTMLDivElement | null>(null);
    const navMenuRef = useRef<HTMLDivElement | null>(null);
    const closeMenuTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const settingsPath = activeRole === 'ADMIN' ? '/dashboard/settings' : '/customer/settings';
    const supportPath = activeRole === 'ADMIN' ? '/dashboard/support' : '/customer/support';
    const policiesPath = activeRole === 'ADMIN' ? '/dashboard/policies' : '/customer/policies';
    const paymentsPath = activeRole === 'ADMIN' ? '/dashboard/payments' : '/customer/payments';

    const userMenuItems = [
        { label: 'Ayarlar', action: () => router.push(settingsPath) },
        { label: 'Yardım', action: () => router.push(supportPath) },
    ];

    const dashboardPath = activeRole === 'ADMIN' ? '/dashboard' : '/customer/dashboard';
    const menuItems = [
        { label: 'Dashboard', path: dashboardPath, roles: ['ADMIN', 'HR_MANAGER', 'EMPLOYEE'] },
        {
            label: 'Poliçeler',
            path: policiesPath,
            roles: ['ADMIN', 'HR_MANAGER', 'EMPLOYEE'],
            children: activeRole === 'ADMIN'
                ? [
                    { label: 'Poliçe Listesi', path: '/dashboard/policies', icon: 'pi pi-file' },
                    { label: 'Poliçe Türleri', path: '/dashboard/settings/policy-types', icon: 'pi pi-cog' },
                ]
                : [
                    { label: 'Poliçe Listesi', path: '/customer/policies', icon: 'pi pi-file' },
                    { label: 'Ödeme Takvimi', path: '/customer/payments', icon: 'pi pi-wallet' },
                ],
        },
        {
            label: 'Şirketler',
            path: '/dashboard/companies',
            roles: ['ADMIN'],
            children: [
                { label: 'Şirketler', path: '/dashboard/companies', icon: 'pi pi-building' },
                { label: 'Çalışanlar', path: '/dashboard/employees', icon: 'pi pi-users' },
                { label: 'Departmanlar', path: '/dashboard/departments', icon: 'pi pi-sitemap' },
            ],
        },
        { label: 'Paketler', path: '/dashboard/packages', roles: ['ADMIN'] },
        { label: 'Markalar', path: '/dashboard/carriers', roles: ['ADMIN'] },
        { label: 'Sozlesmeler', path: '/dashboard/corporate-policies', roles: ['ADMIN'] },
        { label: 'Basvurular', path: '/dashboard/applications', roles: ['ADMIN'] },
        { label: 'Finans', path: paymentsPath, roles: ['ADMIN', 'HR_MANAGER', 'EMPLOYEE'] },
        {
            label: 'Dokumanlar',
            path: '/customer/documents',
            roles: ['HR_MANAGER', 'EMPLOYEE'],
            children: [
                { label: 'Tum Dokumanlar', path: '/customer/documents', icon: 'pi pi-folder' },
                { label: 'Policeler', path: '/customer/documents?category=policy', icon: 'pi pi-file' },
                { label: 'Faturalar', path: '/customer/documents?category=receipt', icon: 'pi pi-wallet' },
                { label: 'Sozlesmeler', path: '/customer/documents?category=contract', icon: 'pi pi-briefcase' },
            ],
        },
        { label: 'Basvurularim', path: '/customer/applications', roles: ['HR_MANAGER', 'EMPLOYEE'] },
        { label: 'Sozlesmelerim', path: '/customer/corporate-policies', roles: ['HR_MANAGER', 'EMPLOYEE'] },
        { label: 'Calisanlar', path: '/customer/employees', roles: ['HR_MANAGER', 'EMPLOYEE'] },
        { label: 'Analytics', path: '/dashboard/analytics', roles: ['ADMIN'] },
    ];
    const handleLogout = () => {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
            api.post('/auth/logout', { refreshToken }).catch(() => undefined);
        }
        logout(); // Store logout clears state
        clearSessionCookie();
        router.push('/auth/login');
    };

    useEffect(() => {
        const listener = (event: MouseEvent) => {
            if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
                setIsUserMenuOpen(false);
            }
            if (navMenuRef.current && !navMenuRef.current.contains(event.target as Node)) {
                setIsPolicyMenuOpen(false);
                setIsCompanyMenuOpen(false);
                setIsDocumentMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', listener);
        return () => document.removeEventListener('mousedown', listener);
    }, []);

    const cancelMenuClose = () => {
        if (closeMenuTimeoutRef.current) {
            clearTimeout(closeMenuTimeoutRef.current);
            closeMenuTimeoutRef.current = null;
        }
    };

    const scheduleMenuClose = (menu: 'policy' | 'company' | 'document') => {
        cancelMenuClose();
        closeMenuTimeoutRef.current = setTimeout(() => {
            if (menu === 'policy') setIsPolicyMenuOpen(false);
            if (menu === 'company') setIsCompanyMenuOpen(false);
            if (menu === 'document') setIsDocumentMenuOpen(false);
        }, 150);
    };

    const shouldUseSidebar = typeof onToggleSidebar === 'function';

    return (
        <header className="sticky top-0 z-50 w-full bg-white border-b border-gray-200 shadow-sm">
            <div className="h-20 px-6 sm:px-8 flex items-center justify-between max-w-[1800px] mx-auto transition-all">
                <div className="flex items-center gap-10">
                    <div className="flex items-center gap-3 cursor-pointer group" onClick={() => router.push(dashboardPath)}>
                        <div className="bg-gradient-to-tr from-gray-900 to-gray-800 rounded-xl flex items-center justify-center shadow-lg shadow-gray-900/20 group-hover:scale-105 transition-transform duration-200">
                            <i className="pi pi-bolt text-white text-lg"></i>
                        </div>
                        <div className="flex flex-col">
                            <span className="font-bold text-base leading-none text-gray-900 tracking-tight font-geist">Agito</span>
                            <span className="text-[10px] font-semibold text-blue-600 uppercase tracking-widest mt-0.5">Portal</span>
                        </div>
                    </div>

                    <nav ref={navMenuRef} className="hidden md:flex items-center gap-1.5 p-1 bg-gray-100/50 rounded-full border border-gray-200/50">
                        {menuItems.filter((item) => (item.roles as string[]).includes(activeRole)).map(item => {
                            const isActive = pathname === item.path;
                            const isPolicyItem = item.label === 'Poliçeler';
                            const isCompanyItem = item.label === 'Şirketler';
                            const isDocumentItem = item.label === 'Dokumanlar';
                            const hasChildren = Array.isArray(item.children) && item.children.length > 0;
                            const handleMenuClick = (event: React.MouseEvent<HTMLButtonElement>) => {
                                if (hasChildren) {
                                    event.preventDefault();
                                    event.stopPropagation();
                                    if (isPolicyItem) setIsPolicyMenuOpen((prev) => !prev);
                                    if (isCompanyItem) setIsCompanyMenuOpen((prev) => !prev);
                                    if (isDocumentItem) setIsDocumentMenuOpen((prev) => !prev);
                                    return;
                                }
                                router.push(item.path);
                            };
                            return (
                                <div
                                    key={item.path}
                                    className="relative"
                                    onMouseEnter={() => {
                                        cancelMenuClose();
                                        if (isPolicyItem) setIsPolicyMenuOpen(true);
                                        if (isCompanyItem) setIsCompanyMenuOpen(true);
                                        if (isDocumentItem) setIsDocumentMenuOpen(true);
                                    }}
                                    onMouseLeave={() => {
                                        if (isPolicyItem) scheduleMenuClose('policy');
                                        if (isCompanyItem) scheduleMenuClose('company');
                                        if (isDocumentItem) scheduleMenuClose('document');
                                    }}
                                >
                                    <button
                                        onClick={handleMenuClick}
                                        className={clsx(
                                            "px-4 py-2 text-xs font-bold rounded-full transition-all duration-300 relative overflow-hidden shrink-0",
                                            isActive
                                                ? "!bg-gray-900 !text-white shadow-md shadow-gray-900/10"
                                                : "text-gray-600 hover:text-gray-900 hover:bg-white/60"
                                        )}
                                    >
                                        {item.label}
                                    </button>
                                    {hasChildren && ((isPolicyItem && isPolicyMenuOpen) || (isCompanyItem && isCompanyMenuOpen) || (isDocumentItem && isDocumentMenuOpen)) && (
                                        <div
                                            className="absolute top-full left-1/4 z-50 mt-2 w-72 -translate-x-1/2 rounded-lg border border-gray-200 bg-white shadow-xl animate-in fade-in zoom-in-95 duration-200"
                                            onMouseEnter={() => {
                                                cancelMenuClose();
                                                if (isPolicyItem) setIsPolicyMenuOpen(true);
                                                if (isCompanyItem) setIsCompanyMenuOpen(true);
                                                if (isDocumentItem) setIsDocumentMenuOpen(true);
                                            }}
                                            onMouseLeave={() => {
                                                if (isPolicyItem) scheduleMenuClose('policy');
                                                if (isCompanyItem) scheduleMenuClose('company');
                                                if (isDocumentItem) scheduleMenuClose('document');
                                            }}
                                        >
                                            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
                                                <div>
                                                    <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-400 font-geist">{item.label}</div>
                                                    <div className="text-xs font-medium text-gray-500 mt-0.5">
                                                        {isPolicyItem ? 'İşlemler ve ayarlar' : isCompanyItem ? 'Organizasyon yönetimi' : 'Arsiv ve dokumanlar'}
                                                    </div>
                                                </div>
                                                <span className="rounded-full bg-gray-100/80 px-2.5 py-1 text-[10px] font-bold text-gray-500 shadow-sm shadow-gray-200/50">
                                                    {isPolicyItem ? 'Kısayol' : isCompanyItem ? 'Kurumsal' : 'Arsiv'}
                                                </span>
                                            </div>
                                            <div className="p-2 space-y-1">
                                                {item.children?.map((child) => (
                                                    <button
                                                        key={child.label}
                                                        className="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-xs font-semibold text-gray-600 hover:bg-white hover:text-gray-900 hover:shadow-md hover:shadow-gray-200/50 transition-all duration-200"
                                                        onClick={() => {
                                                            router.push(child.path);
                                                            setIsPolicyMenuOpen(false);
                                                            setIsCompanyMenuOpen(false);
                                                            setIsDocumentMenuOpen(false);
                                                        }}
                                                    >
                                                        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-50 text-gray-500 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors duration-200">
                                                            <i className={clsx(child.icon, 'text-sm')}></i>
                                                        </span>
                                                        <span className="flex-1 font-medium">{child.label}</span>
                                                        <i className="pi pi-chevron-right text-[10px] text-gray-300 group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all duration-200"></i>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </nav>
                </div>

                <div className="flex items-center gap-5">
                    <div className="h-8 w-px bg-gray-200/60 hidden sm:block"></div>

                    <div className="flex items-center gap-3">
                        <button className="rounded-full hover:bg-gray-100 text-gray-500 flex items-center justify-center transition-all duration-200 relative group">
                            <i className="pi pi-bell text-lg group-hover:text-gray-800 transition-colors"></i>
                            <span className="absolute top-2.5 right-2.5 flex h-2.5 w-2.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500 border-2 border-white"></span>
                            </span>
                        </button>

                        <button
                            onClick={handleLogout}
                            className="hidden sm:flex rounded-full hover:bg-red-50 text-gray-400 hover:text-red-500 items-center justify-center transition-all duration-200"
                            title="Çıkış Yap"
                        >
                            <i className="pi pi-power-off text-lg"></i>
                        </button>

                        <button
                            onClick={() => {
                                if (shouldUseSidebar) {
                                    onToggleSidebar?.();
                                } else {
                                    setIsMenuOpen(!isMenuOpen);
                                }
                            }}
                            className="md:hidden rounded-full hover:bg-gray-100 text-gray-600 flex items-center justify-center transition-all duration-200 w-10 h-10"
                            aria-label={shouldUseSidebar ? 'Menüyü aç' : 'Menüyü aç/kapat'}
                        >
                            <i
                                className={clsx(
                                    "pi text-xl",
                                    shouldUseSidebar
                                        ? isSidebarOpen ? "pi-times" : "pi-bars"
                                        : isMenuOpen ? "pi-times" : "pi-bars"
                                )}
                            ></i>
                        </button>
                    </div>

                    <div ref={userMenuRef} className="relative hidden sm:flex items-center gap-3 pl-2 group shrink-0">
                        <button
                            type="button"
                            onClick={() => setIsUserMenuOpen((prev) => !prev)}
                            className="flex items-center gap-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                        >
                            <div className="text-right hidden xl:block">
                                <div className="text-sm font-bold text-gray-900 leading-tight">{activeName || activeRole}</div>
                                <div className="text-[10px] font-medium text-gray-500 uppercase tracking-wide group-hover:text-blue-600 transition-colors">
                                    {activeRole === 'ADMIN' ? 'Admin' : activeRole === 'HR_MANAGER' ? 'Operasyon' : 'Çalışan'}
                                </div>
                            </div>
                            <div className="relative shrink-0">
                                <div className="rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 p-[2px] shadow-md shadow-blue-500/20 group-hover:shadow-blue-500/40 transition-shadow">
                                    <div className="">
                                        <img
                                            src={activeAvatar || `${process.env.NEXT_PUBLIC_AVATAR_SERVICE_URL}?name=${encodeURIComponent(activeName || 'Agito')}&background=256bb2&color=fff`}
                                            className="w-[3rem] h-[3rem] rounded-full object-cover"
                                            alt="Profile"
                                        />
                                    </div>
                                </div>
                                <span className="absolute bottom-0 right-0 block h-3 w-3 rounded-full border-2 border-white bg-green-500"></span>
                            </div>
                        </button>
                        {isUserMenuOpen && (
                            <div className="absolute right-0 top-full mt-2 w-48 rounded-2xl border border-slate-100 bg-white shadow-lg">
                                {userMenuItems.map((item) => (
                                    <button
                                        key={item.label}
                                        onClick={() => {
                                            item.action();
                                            setIsUserMenuOpen(false);
                                        }}
                                        className="w-full px-4 py-2 text-left text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                                    >
                                        {item.label}
                                    </button>
                                ))}
                                <div className="border-t border-slate-100" />
                                <button
                                    onClick={handleLogout}
                                    className="w-full px-4 py-2 text-left text-xs font-semibold text-red-500 hover:bg-slate-50 transition-colors"
                                >
                                    Çıkış Yap
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {!shouldUseSidebar && isMenuOpen && (
                <div className="md:hidden absolute top-20 left-0 w-full bg-white border-b border-gray-100 shadow-xl overflow-hidden animate-in slide-in-from-top-2 duration-200">
                    <div className="p-4 flex flex-col gap-2">
                        {menuItems.filter((item) => (item.roles as string[]).includes(activeRole)).map(item => {
                            const isActive = pathname === item.path;
                            const isPolicyItem = item.label === 'Poliçeler';
                            const isCompanyItem = item.label === 'Şirketler';
                            const childItems = item.children ?? [];
                            return (
                                <div key={item.path} className="space-y-2">
                                    <button
                                        onClick={() => {
                                            router.push(item.path);
                                            setIsMenuOpen(false);
                                        }}
                                        className={clsx(
                                            "flex items-center justify-between rounded-xl px-4 py-2 text-left text-sm font-semibold transition hover:bg-slate-50",
                                            isActive ? 'bg-slate-100 text-slate-900' : 'text-slate-600'
                                        )}
                                    >
                                        {item.label}
                                        <i className="pi pi-arrow-right text-xs"></i>
                                    </button>
                                    {childItems.length > 0 && (
                                        <div className="grid gap-2 pl-4">
                                            {childItems.map((child) => (
                                                <button
                                                    key={child.label}
                                                    onClick={() => {
                                                        router.push(child.path);
                                                        setIsMenuOpen(false);
                                                    }}
                                                    className="flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600"
                                                >
                                                    <i className={clsx(child.icon, 'text-xs text-slate-500')}></i>
                                                    {child.label}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}
        </header>
    );
};

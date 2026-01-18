'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { clsx } from 'clsx';
import { api } from '../../lib/api';
import { clearSessionCookie } from '../../lib/session';
import { useAuthStore } from '../../store/useAuthStore';

type UserRole = 'ADMIN' | 'HR_MANAGER' | 'EMPLOYEE';

interface SidebarProps {
    variant?: 'desktop' | 'mobile';
    onNavigate?: () => void;
}

export const Sidebar = ({ variant = 'desktop', onNavigate }: SidebarProps) => {
    const pathname = usePathname();
    const router = useRouter();
    const [companySummary, setCompanySummary] = useState<{ count: number; name?: string } | null>(null);
    const [companyLoading, setCompanyLoading] = useState(true);
    const { role: userRole, setAuth, logout } = useAuthStore();
    const activeRole = userRole || 'EMPLOYEE';

    useEffect(() => {
        const fetchRole = async () => {
            // We rely on Topbar to fetch fresh data usually, OR persisted data.
            // But if Sidebar mounts alone (unlikely layout), we can re-fetch.
            // For consistency with old code that fetched /auth/me:
            try {
                // api.get('/auth/me') seems redundant if Topbar calls /users/me. 
                // But let's keep it if it was there or trust store.
                // Old code used /auth/me. Topbar used /users/me. Standardization needed?
                // I will trust the Store's persisted state largely, but if it's missing, maybe fetch.
                // Actually, let's just rely on the Store. If Topbar is present, it fetches. 
                // If we want Sidebar to enable fetch too:
                if (!userRole) {
                    const response = await api.get('/auth/me'); // keeping existing endpoint
                    const role = response.data.role as UserRole;
                    if (role) {
                        setAuth({ role });
                    }
                }
            } catch {
                // ignore
            }
        };

        fetchRole();
    }, [userRole, setAuth]);

    useEffect(() => {
        const fetchCompanySummary = async () => {
            setCompanyLoading(true);
            try {
                const response = await api.get('/companies');
                const list = Array.isArray(response.data) ? response.data : response.data?.data || [];
                const count = list.length;
                const name = list[0]?.name;
                setCompanySummary({ count, name });
            } catch (error) {
                console.error(error);
                setCompanySummary(null);
            } finally {
                setCompanyLoading(false);
            }
        };

        fetchCompanySummary();
    }, []);

    const handleLogout = () => {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
            api.post('/auth/logout', { refreshToken }).catch(() => undefined);
        }
        logout(); // Store logout clears state
        clearSessionCookie();
        router.push('/auth/login');
    };

    const dashboardPath = activeRole === 'ADMIN' ? '/dashboard' : '/customer/dashboard';
    const menuSections = [
        {
            title: 'Genel',
            items: [
                { label: 'Dashboard', icon: 'pi pi-home', path: dashboardPath, roles: ['ADMIN', 'HR_MANAGER', 'EMPLOYEE'] },
                { label: 'Kullanıcılar', icon: 'pi pi-users', path: '/dashboard/test-crud', roles: ['ADMIN'] },
            ],
        },
        {
            title: 'Operasyon',
            items: [
                { label: 'Poliçeler', icon: 'pi pi-file', path: '/dashboard/policies', roles: ['ADMIN', 'HR_MANAGER'] },
                { label: 'Toplu İşlem', icon: 'pi pi-cloud-upload', path: '/dashboard/bulk-upload', roles: ['ADMIN', 'HR_MANAGER'] },
                { label: 'Şirketler', icon: 'pi pi-building', path: '/dashboard/companies', roles: ['ADMIN'] },
                { label: 'Paketler', icon: 'pi pi-box', path: '/dashboard/packages', roles: ['ADMIN'] },
                { label: 'Başvurular', icon: 'pi pi-inbox', path: '/dashboard/applications', roles: ['ADMIN'] },
                { label: 'Sözleşmeler', icon: 'pi pi-briefcase', path: '/dashboard/corporate-policies', roles: ['ADMIN'] },
                { label: 'Departmanlar', icon: 'pi pi-sitemap', path: '/dashboard/departments', roles: ['ADMIN', 'HR_MANAGER'] },
            ],
        },
        {
            title: 'Ayarlar',
            items: [
                { label: 'Poliçe Türleri', icon: 'pi pi-cog', path: '/dashboard/settings/policy-types', roles: ['ADMIN', 'HR_MANAGER', 'EMPLOYEE'] },
                { label: 'Sigorta Markaları', icon: 'pi pi-building', path: '/dashboard/carriers', roles: ['ADMIN'] },
                { label: 'Finans & Ödemeler', icon: 'pi pi-wallet', path: '/dashboard/payments', roles: ['ADMIN', 'HR_MANAGER', 'EMPLOYEE'] },
            ]
        }
    ];

    const handleNavigate = (path: string) => {
        router.push(path);
        onNavigate?.();
    };

    if (variant === 'mobile') {
        return (
            <div className="flex h-full w-full flex-col bg-white">
                <div className="flex items-center justify-between border-b border-[rgb(var(--border))] px-5 py-4">
                    <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-[rgb(var(--accent))] flex items-center justify-center text-white">
                            <i className="pi pi-shield text-sm"></i>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-semibold">Agito Ops</span>
                            <span className="text-xs text-muted">Kurumsal portal</span>
                        </div>
                    </div>
                    <button
                        className="rounded-md border border-[rgb(var(--border))] px-3 py-1 text-xs font-medium"
                        onClick={handleLogout}
                    >
                        Çıkış
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto px-5 py-6">
                    <div className="rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--surface-muted))] p-3">
                        <p className="text-xs uppercase tracking-[0.2em] text-muted">
                            {activeRole === 'ADMIN' ? 'Sirketler' : 'Sirket'}
                        </p>
                        <div className="mt-2 flex items-center justify-between">
                            {companyLoading ? (
                                <span className="text-sm text-muted">Yukleniyor...</span>
                            ) : activeRole === 'ADMIN' ? (
                                <span className="text-xl font-semibold">{companySummary?.count ?? 0}</span>
                            ) : (
                                <span className="text-sm font-semibold text-[rgb(var(--text))]">
                                    {companySummary?.name || 'Sirket bulunamadi'}
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="mt-6 flex flex-col gap-6">
                        {menuSections.map((section) => {
                            const filteredItems = section.items.filter((item) => (item.roles as string[]).includes(activeRole));
                            if (filteredItems.length === 0) return null;
                            return (
                                <div key={section.title} className="flex flex-col gap-2">
                                    <span className="text-[11px] font-semibold uppercase tracking-[0.3em] text-muted">
                                        {section.title}
                                    </span>
                                    {filteredItems.map((item) => {
                                        const isActive = pathname === item.path;
                                        return (
                                            <button
                                                key={item.path}
                                                onClick={() => handleNavigate(item.path)}
                                                className={clsx(
                                                    'flex items-center gap-3 rounded-md px-3 py-2 text-left text-sm font-medium transition-all',
                                                    isActive
                                                        ? 'bg-[rgb(var(--accent))] text-white'
                                                        : 'text-[rgb(var(--text))] hover:bg-[rgb(var(--surface-muted))]'
                                                )}
                                            >
                                                <i className={clsx(item.icon, 'text-sm')}></i>
                                                <span>{item.label}</span>
                                                {item.label === 'Toplu İşlem' && (
                                                    <span className="ml-auto rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-semibold text-emerald-700">
                                                        Yeni
                                                    </span>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="px-5 pb-6">
                    <div className="rounded-lg border border-[rgb(var(--border))] bg-white px-3 py-3 flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-[rgb(var(--surface-muted))] flex items-center justify-center">
                            <i className="pi pi-user text-xs text-[rgb(var(--text))]"></i>
                        </div>
                        <div className="flex flex-column flex-auto">
                            <span className="text-sm font-semibold">Noah Bellingham</span>
                            <span className="text-xs text-muted">noah@gmail.com</span>
                        </div>
                        <i className="pi pi-angle-right text-xs text-muted"></i>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <aside className="hidden md:flex h-full flex-column sticky top-20" style={{ width: '260px' }}>
            <div className="flex flex-column h-full border-r border-[rgb(var(--border))] bg-white px-5 py-6">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-[rgb(var(--accent))] flex items-center justify-center text-white">
                        <i className="pi pi-shield text-base"></i>
                    </div>
                    <div className="flex flex-column">
                        <span className="text-base font-semibold">Agito Ops</span>
                        <span className="text-xs text-muted">B2B sigorta yönetimi</span>
                    </div>
                </div>

                <div className="mt-6 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--surface-muted))] p-3">
                    <p className="text-xs uppercase tracking-[0.2em] text-muted">
                        {activeRole === 'ADMIN' ? 'Sirketler' : 'Sirket'}
                    </p>
                    <div className="mt-2 flex items-center justify-between">
                        {companyLoading ? (
                            <span className="text-sm text-muted">Yukleniyor...</span>
                        ) : activeRole === 'ADMIN' ? (
                            <span className="text-xl font-semibold">{companySummary?.count ?? 0}</span>
                        ) : (
                            <span className="text-sm font-semibold text-[rgb(var(--text))]">
                                {companySummary?.name || 'Sirket bulunamadi'}
                            </span>
                        )}
                    </div>
                </div>

                <div className="mt-6 flex flex-column gap-6 overflow-y-auto">
                    {menuSections.map((section) => {
                        const filteredItems = section.items.filter((item) => (item.roles as string[]).includes(activeRole));
                        if (filteredItems.length === 0) return null;
                        return (
                            <div key={section.title} className="flex flex-column gap-2">
                                <span className="text-[11px] font-semibold uppercase tracking-[0.3em] text-muted">
                                    {section.title}
                                </span>
                                {filteredItems.map((item) => {
                                    const isActive = pathname === item.path;
                                    return (
                                        <button
                                            key={item.path}
                                            onClick={() => handleNavigate(item.path)}
                                            className={clsx(
                                                'flex items-center gap-3 rounded-md px-3 py-2 text-left text-sm font-medium transition-all',
                                                isActive
                                                    ? 'bg-[rgb(var(--accent))] text-white'
                                                    : 'text-[rgb(var(--text))] hover:bg-[rgb(var(--surface-muted))]'
                                            )}
                                        >
                                            <i className={clsx(item.icon, 'text-sm')}></i>
                                            <span>{item.label}</span>
                                            {item.label === 'Toplu İşlem' && (
                                                <span className="ml-auto rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-semibold text-emerald-700">
                                                    Yeni
                                                </span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        );
                    })}
                </div>

                <div className="mt-auto pt-6">
                    <div className="rounded-lg border border-[rgb(var(--border))] bg-white px-3 py-3 flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-[rgb(var(--surface-muted))] flex items-center justify-center">
                            <i className="pi pi-user text-xs text-[rgb(var(--text))]"></i>
                        </div>
                        <div className="flex flex-column flex-auto">
                            <span className="text-sm font-semibold">Noah Bellingham</span>
                            <span className="text-xs text-muted">noah@gmail.com</span>
                        </div>
                        <i className="pi pi-angle-right text-xs text-muted"></i>
                    </div>
                </div>
            </div>
        </aside>
    );
};

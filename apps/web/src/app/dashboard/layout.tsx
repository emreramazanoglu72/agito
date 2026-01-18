'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Topbar } from '../../components/organisms/Topbar';
import { Sidebar } from '../../components/organisms/Sidebar';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { AiAdminAssistant } from '@/components/organisms/AiAdminAssistant';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const pathname = usePathname();
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/auth/login');
        } else {
            const storedRole = localStorage.getItem('role');
            if (pathname === '/dashboard' && storedRole && storedRole !== 'ADMIN') {
                router.push('/customer/dashboard');
                return;
            }
            setIsAuthorized(true);
        }
    }, [router, pathname]);

    if (!isAuthorized) {
        return null; // Or a loading spinner
    }

    return (
        <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
            <Topbar onToggleSidebar={() => setIsSidebarOpen(true)} isSidebarOpen={isSidebarOpen} />
            <div className="flex-1 w-full max-w-[1800px] mx-auto flex">
                <main className="flex-1 p-6 md:p-8">
                    {children}
                </main>
            </div>
            <AiAdminAssistant />
        </div>
    );
}

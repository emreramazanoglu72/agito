'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Topbar } from '../../../components/organisms/Topbar';
import { Sidebar } from '../../../components/organisms/Sidebar';
import { Sheet, SheetContent } from '@/components/ui/sheet';

export default function CustomerLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/auth/login');
        } else {
            const storedRole = localStorage.getItem('role');
            if (storedRole === 'ADMIN') {
                router.push('/dashboard');
                return;
            }
            setIsAuthorized(true);
        }
    }, [router]);

    if (!isAuthorized) {
        return null;
    }

    return (
        <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
            <Topbar onToggleSidebar={() => setIsSidebarOpen(true)} isSidebarOpen={isSidebarOpen} />
            <div className="flex-1 w-full max-w-[1800px] mx-auto flex">
                <main className="flex-1 p-6 md:p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Sparkles, FileText, ArrowRight } from 'lucide-react';

export function ReviewerModal() {
    const [open, setOpen] = useState(false);
    const router = useRouter();

    useEffect(() => {
        // Small delay to ensure hydration and smooth entrance
        const timer = setTimeout(() => setOpen(true), 500);
        return () => clearTimeout(timer);
    }, []);

    const handleGoToDocs = () => {
        setOpen(false);
        router.push('/docs');
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="sm:max-w-[500px] border-0 overflow-hidden p-0 gap-0 rounded-2xl shadow-2xl">
                {/* Gradient Header Background */}
                <div className="bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f766e] p-6 text-white relative overflow-hidden">
                    {/* Decorative Elements */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-500/20 rounded-full blur-2xl translate-y-1/3 -translate-x-1/3" />

                    <div className="relative z-10 flex items-start justify-between">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2 text-teal-300 font-semibold tracking-wider text-xs uppercase mb-2">
                                <Sparkles className="w-4 h-4" />
                                <span>Mülakat İncelemesi</span>
                            </div>
                            <DialogTitle className="text-2xl font-bold text-white tracking-tight">
                                Hoş Geldiniz 👋
                            </DialogTitle>
                        </div>
                        <div className="bg-white/10 p-2 rounded-xl backdrop-blur-md border border-white/10">
                            <span className="text-2xl">💼</span>
                        </div>
                    </div>

                    <DialogDescription className="text-slate-300 mt-3 text-base leading-relaxed">
                        Bu proje, <strong>Senior Frontend Developer</strong> case çalışması kapsamında hazırlanmıştır.
                    </DialogDescription>
                </div>

                {/* Content Body */}
                <div className="p-6 bg-white space-y-5">
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-3">
                        <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                            <FileText className="w-4 h-4 text-blue-600" />
                            Neler Hazırlandı?
                        </h4>
                        <ul className="text-sm text-slate-600 space-y-2 ml-1">
                            <li className="flex items-start gap-2">
                                <span className="text-blue-500 mt-1">•</span>
                                <span>AI destekli, modern Dashbosard arayüzleri</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-blue-500 mt-1">•</span>
                                <span>Unit testleri yazılmış ölçeklenebilir Backend</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-blue-500 mt-1">•</span>
                                <span>Elasticsearch & R2 entegrasyonlu mimari</span>
                            </li>
                        </ul>
                    </div>

                    <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setOpen(false)}
                            className="w-full sm:w-auto rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                        >
                            Demoyu İncele
                        </Button>
                        <Button
                            onClick={handleGoToDocs}
                            className="w-full sm:w-auto rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/20 group"
                        >
                            Dokümantasyona Git
                            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                        </Button>
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    );
}

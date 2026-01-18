'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '../../../components/atoms/Input';
import { Button } from '../../../components/atoms/Button';
import { api } from '../../../lib/api';
import { setSessionCookie } from '../../../lib/session';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';
import { useAuthStore } from '../../../store/useAuthStore';

// Validation Schema
const loginSchema = z.object({
    email: z.string().email('Geçerli bir email giriniz'),
    password: z.string().min(6, 'Şifre en az 6 karakter olmalıdır'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
        resolver: zodResolver(loginSchema),
    });

    const onSubmit = async (data: LoginForm) => {
        setLoading(true);
        try {
            const response = await api.post('/auth/login', {
                email: data.email,
                password: data.password
            });

            localStorage.setItem('token', response.data.access_token);
            if (response.data.access_token) {
                setSessionCookie(response.data.access_token);
            }
            if (response.data.refresh_token) {
                localStorage.setItem('refreshToken', response.data.refresh_token);
            }

            // Use Zustand Store for Profile State
            useAuthStore.getState().setAuth({
                role: response.data.role,
                tenantId: response.data.tenantId,
                name: response.data.name || 'Kullanıcı', // Fallback
                avatar: response.data.avatar
            });

            if (response.data.role && response.data.role !== 'ADMIN') {
                router.push('/customer/dashboard');
            } else {
                router.push('/dashboard');
            }
        } catch (error) {
            alert('Giriş başarısız! (Demo: admin@agito.com / admin123)');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex">
            {/* Left Side - Brand & Visuals */}
            <div className="hidden lg:flex w-1/2 relative bg-[#0a0f1c] text-white flex-col justify-between p-16 overflow-hidden">
                {/* Background Pattern/Gradient */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-blue-900/40 via-[#0a0f1c] to-[#0a0f1c] z-0"></div>

                {/* Brand */}
                <div className="relative z-10 flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-900/20">
                        <i className="pi pi-shield text-lg text-white"></i>
                    </div>
                    <span className="text-lg font-bold tracking-widest uppercase text-white/90 font-geist">Agito</span>
                </div>

                {/* Main Text / Testimonial */}
                <div className="relative z-10 max-w-lg">
                    <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
                        Sigortacılıkta <br />
                        <span className="text-blue-500">Geleceği</span> Tasarlayın.
                    </h1>
                    <p className="text-lg text-white/50 leading-relaxed mb-8">
                        Kurumsal operasyonlarınızı tek bir platformdan yönetin, verimliliği artırın ve güvenliği en üst düzeye çıkarın.
                    </p>

                    {/* Glassmorphic Card */}
                    <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 shadow-2xl">
                        <div className="flex gap-4 items-start">
                            <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400">
                                <i className="pi pi-check-circle text-xl"></i>
                            </div>
                            <div>
                                <h3 className="text-white font-medium mb-1">Uçtan Uca Yönetim</h3>
                                <p className="text-sm text-white/40">Poliçe, çalışan ve şirket yönetimini tek ekranda birleştirin.</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="relative z-10 flex gap-6 text-sm text-white/30">
                    <span>© 2024 Agito Yazılım</span>
                    <a href="#" className="hover:text-white/60 transition-colors">Gizlilik</a>
                    <a href="#" className="hover:text-white/60 transition-colors">Şartlar</a>
                </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center bg-white p-8 md:p-12 lg:p-24">
                <div className="w-full max-w-[420px] space-y-8">
                    {/* Mobile Header (Visible only on small screens) */}
                    <div className="lg:hidden flex items-center gap-2 mb-8">
                        <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center">
                            <i className="pi pi-shield text-sm text-white"></i>
                        </div>
                        <span className="font-bold text-gray-900 uppercase tracking-widest">Agito</span>
                    </div>

                    {/* Form Header */}
                    <div className="text-center lg:text-left">
                        <h2 className="text-3xl font-bold tracking-tight text-gray-900">Hoş Geldiniz</h2>
                        <p className="mt-2 text-gray-500">Hesabınıza giriş yaparak devam edin.</p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        <div className="space-y-4">
                            <Input
                                id="email"
                                label="E-posta Adresi"
                                placeholder="ad.soyad@sirket.com"
                                error={errors.email?.message}
                                {...register('email')}
                                className="h-12 bg-gray-50 border-gray-200 focus:border-indigo-500 focus:ring-indigo-500/20"
                            />

                            <div className="space-y-1">
                                <Input
                                    id="password"
                                    type="password"
                                    label="Şifre"
                                    placeholder="••••••••"
                                    error={errors.password?.message}
                                    feedback={false}
                                    {...register('password')}
                                    className="h-12 bg-gray-50 border-gray-200 focus:border-indigo-500 focus:ring-indigo-500/20"
                                />
                                <div className="flex justify-end">
                                    <a href="#" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
                                        Şifremi Unuttum
                                    </a>
                                </div>
                            </div>
                        </div>

                        <Button
                            label={loading ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
                            icon={loading ? "pi pi-spin pi-spinner" : "pi pi-arrow-right"}
                            iconPos="right"
                            loading={loading}
                            fullWidth
                            className="h-12 text-base rounded-xl !bg-indigo-600 hover:!bg-indigo-700 active:!bg-indigo-800 !border-none transition-all shadow-lg shadow-indigo-200 !text-white font-medium"
                        />
                    </form>

                    <div className="text-center text-sm text-gray-500">
                        Hesabin yok mu?{' '}
                        <Link href="/auth/register" className="font-semibold text-indigo-600 hover:text-indigo-700">
                            Kurumsal kayit ol
                        </Link>
                    </div>

                    {/* Divider */}
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-200"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-white text-gray-400">Demo Hesap</span>
                        </div>
                    </div>

                    <div className="space-y-3">
                        {/* Admin Credentials */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-3 rounded-lg border border-gray-100 bg-gray-50 text-center relative group">
                                <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-indigo-100 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded-full">Admin</span>
                                <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">Email</div>
                                <code className="text-sm font-semibold text-gray-700">admin@agito.com</code>
                            </div>
                            <div className="p-3 rounded-lg border border-gray-100 bg-gray-50 text-center">
                                <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">Şifre</div>
                                <code className="text-sm font-semibold text-gray-700">admin123</code>
                            </div>
                        </div>

                        {/* Customer/Employee Credentials */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-3 rounded-lg border border-gray-100 bg-gray-50 text-center relative group">
                                <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full">Customer</span>
                                <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">Email</div>
                                <code className="text-sm font-semibold text-gray-700">viewer@agito.com</code>
                            </div>
                            <div className="p-3 rounded-lg border border-gray-100 bg-gray-50 text-center">
                                <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">Şifre</div>
                                <code className="text-sm font-semibold text-gray-700">admin123</code>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

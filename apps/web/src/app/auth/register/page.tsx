'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Input } from '../../../components/atoms/Input';
import { Button } from '../../../components/atoms/Button';
import { Label } from '@/components/ui/label';
import { api } from '../../../lib/api';
import { setSessionCookie } from '../../../lib/session';

const registerSchema = z.object({
    companyName: z.string().min(2, 'Sirket adi zorunludur'),
    taxNumber: z.string().min(10, 'Vergi no en az 10 hane olmalidir'),
    contactName: z.string().min(2, 'Yetkili ad soyad zorunludur'),
    email: z.string().email('Gecerli bir e-posta giriniz'),
    phone: z.string().min(10, 'Telefon zorunludur'),
    password: z.string().min(6, 'Sifre en az 6 karakter olmalidir'),
    industry: z.string().min(1, 'Sektor seciniz'),
    employeeCount: z.string().min(1, 'Calisan sayisi seciniz'),
    consent: z.boolean().refine(val => val === true, {
        message: 'Kullanim kosullarini kabul edin'
    })
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { register, handleSubmit, formState: { errors } } = useForm<RegisterForm>({
        resolver: zodResolver(registerSchema)
    });

    const onSubmit = async (data: RegisterForm) => {
        setLoading(true);
        setError(null);
        try {
            const payload = {
                companyName: data.companyName,
                taxNumber: data.taxNumber,
                contactName: data.contactName,
                email: data.email,
                phone: data.phone,
                password: data.password,
                industry: data.industry,
                employeeCount: data.employeeCount
            };
            const response = await api.post('/auth/register', payload);
            if (response?.data?.access_token) {
                localStorage.setItem('token', response.data.access_token);
                setSessionCookie(response.data.access_token);
                if (response.data.refresh_token) {
                    localStorage.setItem('refreshToken', response.data.refresh_token);
                }
                if (response.data.role) {
                    localStorage.setItem('role', response.data.role);
                }
                if (response.data.tenantId) {
                    localStorage.setItem('tenantId', response.data.tenantId);
                }
                router.push('/customer/dashboard');
            } else {
                router.push('/auth/login');
            }
        } catch (err) {
            setError('Kayit basarisiz. Lutfen bilgileri kontrol edin.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex">
            <div className="hidden lg:flex w-1/2 relative bg-[#0a0f1c] text-white flex-col justify-between p-16 overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-emerald-900/30 via-[#0a0f1c] to-[#0a0f1c] z-0"></div>

                <div className="relative z-10 flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-900/20">
                        <i className="pi pi-shield text-lg text-white"></i>
                    </div>
                    <span className="text-lg font-bold tracking-widest uppercase text-white/90 font-geist">Agito</span>
                </div>

                <div className="relative z-10 max-w-lg">
                    <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
                        Kurumsal sigorta
                        <br />
                        operasyonlarini hizlandirin.
                    </h1>
                    <p className="text-lg text-white/50 leading-relaxed mb-8">
                        Sirketinizi tek panelden yonetin. Yenileme, odeme ve calisan sureclerini otomatiklestirin.
                    </p>

                    <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 shadow-2xl">
                        <div className="flex gap-4 items-start">
                            <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
                                <i className="pi pi-check-circle text-xl"></i>
                            </div>
                            <div>
                                <h3 className="text-white font-medium mb-1">Kurumsal uyum</h3>
                                <p className="text-sm text-white/40">Talepler, odemeler ve raporlar tek akista.</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="relative z-10 flex gap-6 text-sm text-white/30">
                    <span>© 2024 Agito Yazilim</span>
                    <a href="#" className="hover:text-white/60 transition-colors">Gizlilik</a>
                    <a href="#" className="hover:text-white/60 transition-colors">Sartlar</a>
                </div>
            </div>

            <div className="w-full lg:w-1/2 flex items-center justify-center bg-white p-8 md:p-12 lg:p-20">
                <div className="w-full max-w-[520px] space-y-8">
                    <div className="lg:hidden flex items-center gap-2 mb-8">
                        <div className="h-8 w-8 rounded-lg bg-emerald-600 flex items-center justify-center">
                            <i className="pi pi-shield text-sm text-white"></i>
                        </div>
                        <span className="font-bold text-gray-900 uppercase tracking-widest">Agito</span>
                    </div>

                    <div className="text-center lg:text-left">
                        <h2 className="text-3xl font-bold tracking-tight text-gray-900">Kurumsal kayit</h2>
                        <p className="mt-2 text-gray-500">Sirket hesabini olustur, ekibini davet et.</p>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input
                                id="companyName"
                                label="Sirket adi"
                                placeholder="Ornek Sigorta A.S."
                                error={errors.companyName?.message}
                                {...register('companyName')}
                                className="h-12 bg-gray-50 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500/20"
                            />
                            <Input
                                id="taxNumber"
                                label="Vergi no"
                                placeholder="1234567890"
                                error={errors.taxNumber?.message}
                                {...register('taxNumber')}
                                className="h-12 bg-gray-50 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500/20"
                            />
                            <Input
                                id="contactName"
                                label="Yetkili ad soyad"
                                placeholder="Ad Soyad"
                                error={errors.contactName?.message}
                                {...register('contactName')}
                                className="h-12 bg-gray-50 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500/20"
                            />
                            <Input
                                id="email"
                                label="Kurumsal e-posta"
                                placeholder="ad.soyad@sirket.com"
                                error={errors.email?.message}
                                {...register('email')}
                                className="h-12 bg-gray-50 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500/20"
                            />
                            <Input
                                id="phone"
                                label="Telefon"
                                placeholder="05xx xxx xx xx"
                                error={errors.phone?.message}
                                {...register('phone')}
                                className="h-12 bg-gray-50 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500/20"
                            />
                            <Input
                                id="password"
                                type="password"
                                label="Sifre"
                                placeholder="••••••••"
                                error={errors.password?.message}
                                {...register('password')}
                                className="h-12 bg-gray-50 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500/20"
                            />
                            <div className="flex flex-col gap-2">
                                <Label htmlFor="industry">Sektor</Label>
                                <select
                                    id="industry"
                                    {...register('industry')}
                                    className="h-12 rounded-md border border-gray-200 bg-gray-50 px-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                                >
                                    <option value="">Seciniz</option>
                                    <option value="health">Saglik</option>
                                    <option value="finance">Finans</option>
                                    <option value="retail">Perakende</option>
                                    <option value="tech">Teknoloji</option>
                                    <option value="other">Diger</option>
                                </select>
                                {errors.industry && <small className="text-xs text-destructive">{errors.industry.message}</small>}
                            </div>
                            <div className="flex flex-col gap-2">
                                <Label htmlFor="employeeCount">Calisan sayisi</Label>
                                <select
                                    id="employeeCount"
                                    {...register('employeeCount')}
                                    className="h-12 rounded-md border border-gray-200 bg-gray-50 px-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                                >
                                    <option value="">Seciniz</option>
                                    <option value="1-25">1-25</option>
                                    <option value="26-100">26-100</option>
                                    <option value="101-300">101-300</option>
                                    <option value="301-1000">301-1000</option>
                                    <option value="1000+">1000+</option>
                                </select>
                                {errors.employeeCount && <small className="text-xs text-destructive">{errors.employeeCount.message}</small>}
                            </div>
                        </div>

                        <label className="flex items-start gap-2 text-sm text-gray-600">
                            <input type="checkbox" className="mt-1" {...register('consent')} />
                            <span>Kullanim sartlari ve gizlilik politikasini kabul ediyorum.</span>
                        </label>
                        {errors.consent && <small className="text-xs text-destructive">{errors.consent.message}</small>}

                        {error && (
                            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
                                {error}
                            </div>
                        )}

                        <Button
                            type="submit"
                            loading={loading}
                            fullWidth
                            className="h-12 bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                            Kurumsal kaydi baslat
                        </Button>
                    </form>

                    <div className="text-center text-sm text-gray-500">
                        Zaten hesabin var mi?{' '}
                        <Link href="/auth/login" className="font-semibold text-emerald-600 hover:text-emerald-700">
                            Giris yap
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

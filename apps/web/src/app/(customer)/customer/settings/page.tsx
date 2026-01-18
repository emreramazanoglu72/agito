'use client';

import React, { useEffect, useState } from 'react';
import { api } from '../../../../lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { useForm } from 'react-hook-form';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function CustomerSettingsPage() {
    const { toast } = useToast();
    const [user, setUser] = useState<any>(null);
    const [company, setCompany] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const { register: registerProfile, handleSubmit: handleProfileSubmit, setValue: setProfileValue } = useForm();
    const { register: registerPass, handleSubmit: handlePassSubmit, reset: resetPass } = useForm();

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const [userRes, companyRes] = await Promise.all([
                api.get('/users/me'),
                api.get('/companies')
            ]);
            setUser(userRes.data);
            setProfileValue('name', userRes.data.name);
            setProfileValue('email', userRes.data.email);
            const companyList = Array.isArray(companyRes.data) ? companyRes.data : companyRes.data?.data || [];
            setCompany(companyList[0] ?? null);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            const file = event.target.files[0];
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const onUpdateProfile = async (data: any) => {
        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('name', data.name);
            formData.append('email', data.email);
            if (selectedFile) {
                formData.append('avatar', selectedFile);
            }

            await api.put('/users/profile', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            toast({ title: 'Basarili', description: 'Profil bilgileri guncellendi' });
            fetchProfile();
        } catch (err) {
            console.error(err);
            toast({ title: 'Hata', description: 'Guncelleme basarisiz' });
        } finally {
            setUploading(false);
        }
    };

    const onChangePassword = async (data: any) => {
        if (data.newPassword !== data.confirmPassword) {
            toast({ title: 'Hata', description: 'Yeni sifreler eslesmiyor' });
            return;
        }

        try {
            await api.post('/users/change-password', data);
            toast({ title: 'Basarili', description: 'Sifreniz guncellendi' });
            resetPass();
        } catch (err: any) {
            console.error(err);
            toast({ title: 'Hata', description: err.response?.data?.message || 'Sifre degistirilemedi' });
        }
    };

    if (loading) {
        return <div className="p-10 text-center text-slate-500">Yukleniyor...</div>;
    }

    return (
        <div className="flex flex-col gap-6 pb-10">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">Musteri Ayarlari</h1>
                <p className="text-slate-500">Profilinizi ve sirket bilgilerinizi yonetin.</p>
            </div>

            <Tabs defaultValue="profile" className="w-full">
                <TabsList className="grid w-full grid-cols-3 lg:w-[420px]">
                    <TabsTrigger value="profile">Profil</TabsTrigger>
                    <TabsTrigger value="company">Sirket</TabsTrigger>
                    <TabsTrigger value="security">Guvenlik</TabsTrigger>
                </TabsList>

                <div className="mt-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
                    <Card className="lg:col-span-1 h-fit shadow-sm border-slate-200">
                        <CardHeader className="text-center">
                            <div className="mx-auto mb-4 relative group cursor-pointer">
                                <Avatar className="h-24 w-24">
                                    <AvatarImage src={previewUrl || user?.avatarUrl} />
                                    <AvatarFallback className="text-2xl bg-slate-100 text-slate-500">
                                        {user?.name?.substring(0, 2).toUpperCase() || 'AG'}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <span className="text-white text-xs font-semibold">Degistir</span>
                                </div>
                            </div>
                            <CardTitle>{user?.name || 'Isimsiz Kullanici'}</CardTitle>
                            <CardDescription>{user?.email}</CardDescription>
                            <div className="mt-2 inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-500">
                                {user?.role}
                            </div>
                        </CardHeader>
                    </Card>

                    <div className="lg:col-span-3">
                        <TabsContent value="profile" className="m-0">
                            <Card className="shadow-sm border-slate-200">
                                <CardHeader>
                                    <CardTitle>Profil Bilgileri</CardTitle>
                                    <CardDescription>Kullanicinin hesap bilgileri.</CardDescription>
                                </CardHeader>
                                <form onSubmit={handleProfileSubmit(onUpdateProfile)}>
                                    <CardContent className="space-y-4">
                                        <div className="flex items-center gap-4">
                                            <div className="relative group cursor-pointer" onClick={() => document.getElementById('avatar-upload')?.click()}>
                                                <Avatar className="h-16 w-16">
                                                    <AvatarImage src={previewUrl || user?.avatarUrl} />
                                                    <AvatarFallback>{user?.name?.substring(0, 2).toUpperCase() || 'AG'}</AvatarFallback>
                                                </Avatar>
                                                <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <span className="text-white text-[10px] font-semibold">Duzenle</span>
                                                </div>
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm font-medium">Profil Fotograf</p>
                                                <p className="text-xs text-slate-500">JPG, PNG veya GIF (Maks. 2MB)</p>
                                                <Input
                                                    id="avatar-upload"
                                                    type="file"
                                                    className="hidden"
                                                    accept="image/*"
                                                    onChange={handleFileChange}
                                                />
                                            </div>
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="name">Ad Soyad</Label>
                                            <Input id="name" {...registerProfile('name')} />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="email">E-posta</Label>
                                            <Input id="email" type="email" {...registerProfile('email')} />
                                        </div>
                                    </CardContent>
                                    <CardFooter className="flex justify-end border-t bg-slate-50/50 p-4">
                                        <Button type="submit" className="bg-slate-900 text-white hover:bg-slate-800" disabled={uploading}>
                                            {uploading ? 'Yukleniyor...' : 'Kaydet'}
                                        </Button>
                                    </CardFooter>
                                </form>
                            </Card>
                        </TabsContent>

                        <TabsContent value="company" className="m-0">
                            <Card className="shadow-sm border-slate-200">
                                <CardHeader>
                                    <CardTitle>Sirket Bilgileri</CardTitle>
                                    <CardDescription>Kurumsal hesap ozetiniz.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid gap-2">
                                        <Label>Sirket adi</Label>
                                        <Input value={company?.name || '-'} readOnly />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Vergi no</Label>
                                        <Input value={company?.taxId || '-'} readOnly />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Sehir</Label>
                                        <Input value={company?.city || '-'} readOnly />
                                    </div>
                                </CardContent>
                                <CardFooter className="flex justify-end border-t bg-slate-50/50 p-4">
                                    <Button variant="outline" disabled>Sirket bilgisi guncelleme yakinda</Button>
                                </CardFooter>
                            </Card>
                        </TabsContent>

                        <TabsContent value="security" className="m-0">
                            <Card className="shadow-sm border-slate-200">
                                <CardHeader>
                                    <CardTitle>Sifre Degistir</CardTitle>
                                    <CardDescription>Hesap guvenliginiz icin sifrenizi guncelleyin.</CardDescription>
                                </CardHeader>
                                <form onSubmit={handlePassSubmit(onChangePassword)}>
                                    <CardContent className="space-y-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="currentPassword">Mevcut sifre</Label>
                                            <Input id="currentPassword" type="password" {...registerPass('currentPassword', { required: true })} />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="newPassword">Yeni sifre</Label>
                                            <Input id="newPassword" type="password" {...registerPass('newPassword', { required: true, minLength: 6 })} />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="confirmPassword">Yeni sifre (tekrar)</Label>
                                            <Input id="confirmPassword" type="password" {...registerPass('confirmPassword', { required: true })} />
                                        </div>
                                    </CardContent>
                                    <CardFooter className="flex justify-end border-t bg-slate-50/50 p-4">
                                        <Button type="submit" variant="destructive">Sifreyi guncelle</Button>
                                    </CardFooter>
                                </form>
                            </Card>
                        </TabsContent>
                    </div>
                </div>
            </Tabs>
        </div>
    );
}


'use client';

import React, { useState, useEffect } from 'react';
import { api } from '../../../lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { User, Lock, Bell, Building } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useUser, useUpdateProfile, useChangePassword } from '@/hooks/queries/useAuth';

export default function SettingsPage() {
    const { toast } = useToast();
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const { data: user, isLoading: isUserLoading } = useUser();
    const updateProfileMutation = useUpdateProfile();
    const changePasswordMutation = useChangePassword();

    // Form setup with default values from user data
    const { register: registerProfile, handleSubmit: handleProfileSubmit, setValue: setProfileValue } = useForm({
        defaultValues: {
            name: user?.fullName || '',
            email: user?.email || '',
        }
    });

    // Update form values when user data is loaded
    useEffect(() => {
        if (user) {
            setProfileValue('name', user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim());
            setProfileValue('email', user.email || '');
        }
    }, [user, setProfileValue]);

    const { register: registerPass, handleSubmit: handlePassSubmit, reset: resetPass } = useForm();

    const onUpdateProfile = (data: any) => {
        const formData = new FormData();
        formData.append('name', data.name);
        formData.append('email', data.email);

        // Note: Avatar file handling needs to be wired up specifically if changed
        // For now, we assume the file input handler (handleFileChange) triggers the mutation or prepares state
        // But the previous implementation uploaded directly on file change.
        // Let's keep the existing pattern for now or adapt if needed.
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Preview
        const reader = new FileReader();
        reader.onloadend = () => {
            setPreviewUrl(reader.result as string);
        };
        reader.readAsDataURL(file);

        // Upload immediately using mutation
        const formData = new FormData();
        formData.append('avatar', file);
        updateProfileMutation.mutate(formData);
    };

    // Re-impl of onUpdateProfile to use the mutation for text fields if API supports widely
    // The previous implementation for text fields was missing in the provided snippet logic, 
    // it seemed to focus on avatar upload. We'll implement text update if API supports it.
    // Assuming `updateProfileMutation` handles multipart, we can use it.
    const onProfileTextSubmit = (data: any) => {
        const formData = new FormData();
        formData.append('name', data.name);
        formData.append('email', data.email);
        updateProfileMutation.mutate(formData);
    }

    // Override the form submit to use our text submit
    const onUpdateProfileHandler = handleProfileSubmit(onProfileTextSubmit);

    const onChangePassword = (data: any) => {
        changePasswordMutation.mutate(data, {
            onSuccess: () => resetPass()
        });
    };

    if (isUserLoading) {
        return <div className="p-10 text-center text-muted-foreground">Yükleniyor...</div>;
    }

    if (!user) {
        return <div className="p-10 text-center text-red-500">Kullanıcı bilgileri yüklenemedi.</div>;
    }

    return (
        <div className="flex flex-col gap-8 animate-fade-in pb-10">
            <div className="flex flex-col gap-1">
                <h1 className="text-2xl font-semibold tracking-tight text-foreground">Ayarlar</h1>
                <p className="text-muted-foreground">Profilinizi ve hesap tercihlerinizi yönetin.</p>
            </div>

            <Tabs defaultValue="profile" className="w-full">
                <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent gap-6">
                    <TabsTrigger
                        value="profile"
                        className="rounded-none border-b-2 border-transparent px-2 py-2 text-muted-foreground data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none bg-transparent"
                    >
                        Profil
                    </TabsTrigger>
                    <TabsTrigger
                        value="security"
                        className="rounded-none border-b-2 border-transparent px-2 py-2 text-muted-foreground data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none bg-transparent"
                    >
                        Güvenlik
                    </TabsTrigger>
                    <TabsTrigger
                        value="notifications"
                        className="rounded-none border-b-2 border-transparent px-2 py-2 text-muted-foreground data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none bg-transparent"
                    >
                        Bildirimler
                    </TabsTrigger>
                </TabsList>

                <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* User Card - Left Column */}
                    <div className="lg:col-span-4 xl:col-span-3">
                        <Card className="h-fit">
                            <CardHeader className="text-center pb-6">
                                <div className="mx-auto mb-4 relative group cursor-pointer inline-block">
                                    <Avatar className="h-24 w-24 ring-4 ring-slate-50">
                                        <AvatarImage src={user.avatarUrl} className="object-cover" />
                                        <AvatarFallback className="text-2xl bg-secondary text-secondary-foreground font-semibold">
                                            {user.name?.substring(0, 2).toUpperCase() || 'TR'}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="absolute inset-0 bg-primary/80 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 backdrop-blur-sm">
                                        <span className="text-white text-xs font-semibold">Değiştir</span>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <CardTitle className="text-lg">{user.name || 'İsimsiz Kullanıcı'}</CardTitle>
                                    <CardDescription>{user.email}</CardDescription>
                                </div>
                                <div className="mt-4 inline-flex items-center rounded-md bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 border border-blue-100">
                                    {user.role === 'ADMIN' ? 'Yönetici' : user.role === 'HR_MANAGER' ? 'İnsan Kaynakları' : 'Çalışan'}
                                </div>
                            </CardHeader>
                        </Card>
                    </div>

                    {/* Main Content Area - Right Column */}
                    <div className="lg:col-span-8 xl:col-span-9 space-y-6">
                        <TabsContent value="profile" className="m-0 focus-visible:outline-none">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Profil Bilgileri</CardTitle>
                                    <CardDescription>
                                        Kişisel bilgilerinizi buradan güncelleyebilirsiniz.
                                    </CardDescription>
                                </CardHeader>
                                <form onSubmit={onUpdateProfileHandler}>
                                    <CardContent className="space-y-6">
                                        <div className="flex items-center gap-6 p-4 rounded-lg border bg-slate-50/50">
                                            <div className="relative group cursor-pointer shrink-0" onClick={() => document.getElementById('avatar-upload')?.click()}>
                                                <Avatar className="h-16 w-16 border-2 border-white shadow-sm">
                                                    <AvatarImage src={previewUrl || user.avatarUrl} className="object-cover" />
                                                    <AvatarFallback>{user.name?.substring(0, 2).toUpperCase()}</AvatarFallback>
                                                </Avatar>
                                                <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200">
                                                    <span className="text-white text-[10px] font-semibold">Düzenle</span>
                                                </div>
                                            </div>
                                            <div className="flex-1 space-y-1">
                                                <p className="text-sm font-semibold text-foreground">Profil Fotoğrafı</p>
                                                <p className="text-xs text-muted-foreground">JPG, PNG veya GIF (Maks. 2MB)</p>
                                                <Input
                                                    id="avatar-upload"
                                                    type="file"
                                                    className="hidden"
                                                    accept="image/*"
                                                    onChange={handleFileChange}
                                                />
                                            </div>
                                            <Button type="button" variant="outline" size="sm" onClick={() => document.getElementById('avatar-upload')?.click()}>
                                                Seç
                                            </Button>
                                        </div>
                                        <div className="grid gap-6 md:grid-cols-2">
                                            <div className="space-y-2">
                                                <Label htmlFor="name">Ad Soyad</Label>
                                                <Input id="name" {...registerProfile('name')} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="email">E-posta</Label>
                                                <Input id="email" type="email" {...registerProfile('email')} />
                                            </div>
                                        </div>
                                    </CardContent>
                                    <CardFooter className="flex justify-end border-t p-6">
                                        <Button type="submit" disabled={updateProfileMutation.isPending}>
                                            {updateProfileMutation.isPending ? 'Yükleniyor...' : 'Değişiklikleri Kaydet'}
                                        </Button>
                                    </CardFooter>
                                </form>
                            </Card>
                        </TabsContent>

                        <TabsContent value="security" className="m-0 focus-visible:outline-none">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Şifre Değiştir</CardTitle>
                                    <CardDescription>
                                        Hesap güvenliğiniz için güçlü bir şifre kullanın.
                                    </CardDescription>
                                </CardHeader>
                                <form onSubmit={handlePassSubmit(onChangePassword)}>
                                    <CardContent className="space-y-4 max-w-md">
                                        <div className="space-y-2">
                                            <Label htmlFor="currentPassword">Mevcut Şifre</Label>
                                            <Input id="currentPassword" type="password" className="font-mono" {...registerPass('currentPassword', { required: true })} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="newPassword">Yeni Şifre</Label>
                                            <Input id="newPassword" type="password" className="font-mono" {...registerPass('newPassword', { required: true, minLength: 6 })} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="confirmPassword">Yeni Şifre (Tekrar)</Label>
                                            <Input id="confirmPassword" type="password" className="font-mono" {...registerPass('confirmPassword', { required: true })} />
                                        </div>
                                    </CardContent>
                                    <CardFooter className="flex justify-end border-t p-6">
                                        <Button type="submit">
                                            Şifreyi Güncelle
                                        </Button>
                                    </CardFooter>
                                </form>
                            </Card>
                        </TabsContent>

                        <TabsContent value="notifications" className="m-0 focus-visible:outline-none">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Bildirim Tercihleri</CardTitle>
                                    <CardDescription>
                                        Hangi durumlarda bildirim almak istediğinizi seçin.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="grid gap-4">
                                    <div className="flex items-center justify-between rounded-lg border p-4 bg-slate-50/50">
                                        <div className="space-y-0.5">
                                            <Label className="text-base font-medium">Poliçe Hatırlatmaları</Label>
                                            <p className="text-sm text-muted-foreground">
                                                Vadesi yaklaşan poliçeler için e-posta al.
                                            </p>
                                        </div>
                                        <input type="checkbox" className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary" defaultChecked />
                                    </div>
                                    <div className="flex items-center justify-between rounded-lg border p-4 bg-slate-50/50">
                                        <div className="space-y-0.5">
                                            <Label className="text-base font-medium">Ödeme Bildirimleri</Label>
                                            <p className="text-sm text-muted-foreground">
                                                Başarılı veya başarısız ödemeler hakkında bildirim al.
                                            </p>
                                        </div>
                                        <input type="checkbox" className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary" defaultChecked />
                                    </div>
                                </CardContent>
                                <CardFooter className="flex justify-end border-t p-6">
                                    <Button disabled variant="outline">Kaydet (Yakında)</Button>
                                </CardFooter>
                            </Card>
                        </TabsContent>
                    </div>
                </div>
            </Tabs >
        </div >
    );
}

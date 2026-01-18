import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';
import { useToast } from '@/components/ui/use-toast';

export const USER_QUERY_KEY = ['user', 'me'];

export function useUser() {
    const { setAuth } = useAuthStore();

    return useQuery({
        queryKey: USER_QUERY_KEY,
        queryFn: async () => {
            const { data } = await api.get('/users/me');

            // Sync with Zustand store on successful fetch
            if (data) {
                setAuth({
                    role: data.role,
                    name: data.fullName || `${data.firstName || ''} ${data.lastName || ''}`.trim(),
                    avatar: data.avatarUrl,
                    tenantId: data.tenantId
                });
            }

            return data;
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
}

export function useUpdateProfile() {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: async (formData: FormData) => {
            const { data } = await api.put('/users/profile', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: USER_QUERY_KEY });
            toast({ title: 'Başarılı', description: 'Profil bilgileri güncellendi' });
        },
        onError: () => {
            toast({ title: 'Hata', description: 'Güncelleme başarısız', className: 'bg-red-50 border-red-200 text-red-900' });
        }
    });
}

export function useChangePassword() {
    const { toast } = useToast();

    return useMutation({
        mutationFn: async (data: any) => {
            const { data: response } = await api.post('/users/change-password', data);
            return response;
        },
        onSuccess: () => {
            toast({ title: 'Başarılı', description: 'Şifreniz başarıyla değiştirildi' });
        },
        onError: (error: any) => {
            const message = error.response?.data?.message || 'Şifre değiştirilemedi';
            toast({ title: 'Hata', description: message, className: 'bg-red-50 border-red-200 text-red-900' });
        }
    });
}

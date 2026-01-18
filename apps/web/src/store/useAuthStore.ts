import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface AuthState {
    role: string | null;
    name: string | null;
    avatar: string | null;
    tenantId: string | null;
    isAuthenticated: boolean;

    setAuth: (data: { role?: string; name?: string; avatar?: string; tenantId?: string }) => void;
    logout: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            role: null,
            name: null,
            avatar: null,
            tenantId: null,
            isAuthenticated: false,

            setAuth: (data) =>
                set((state) => ({
                    ...state,
                    ...data,
                    isAuthenticated: true,
                })),

            logout: () => {
                // Clear local storage tokens manually as they are not managed by this store
                if (typeof window !== 'undefined') {
                    localStorage.removeItem('token');
                    localStorage.removeItem('refreshToken');
                    // Also clear legacy keys just in case
                    localStorage.removeItem('role');
                    localStorage.removeItem('userName');
                    localStorage.removeItem('userAvatar');
                    localStorage.removeItem('tenantId');
                }
                set({
                    role: null,
                    name: null,
                    avatar: null,
                    tenantId: null,
                    isAuthenticated: false,
                });
            },
        }),
        {
            name: 'auth-storage', // unique name
            storage: createJSONStorage(() => localStorage),
        }
    )
);

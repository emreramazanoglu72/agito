import axios, { AxiosResponse, InternalAxiosRequestConfig } from 'axios';

interface RefreshResponse {
    access_token: string;
    refresh_token: string;
}

export const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1',
    headers: {
        'Content-Type': 'application/json',
    },
});

let refreshPromise: Promise<AxiosResponse<RefreshResponse>> | null = null;

// Request Interceptor: Attach Token if exists
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    }
    return config;
});

// Response Interceptor: Handle 401
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        if (error.response?.status === 401 && !originalRequest?._retry) {
            if (typeof window === 'undefined') {
                return Promise.reject(error);
            }

            const refreshToken = localStorage.getItem('refreshToken');
            if (!refreshToken) {
                localStorage.removeItem('token');
                window.location.href = '/auth/login';
                return Promise.reject(error);
            }

            try {
                originalRequest._retry = true;
                if (!refreshPromise) {
                    refreshPromise = api.post<RefreshResponse>('/auth/refresh', { refreshToken });
                }
                const response = await refreshPromise;
                refreshPromise = null;

                const newAccessToken = response.data.access_token;
                const newRefreshToken = response.data.refresh_token;
                if (newAccessToken) {
                    localStorage.setItem('token', newAccessToken);
                }
                if (newRefreshToken) {
                    localStorage.setItem('refreshToken', newRefreshToken);
                }

                originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                return api(originalRequest);
            } catch (refreshError) {
                refreshPromise = null;
                localStorage.removeItem('token');
                localStorage.removeItem('refreshToken');
                window.location.href = '/auth/login';
                return Promise.reject(refreshError);
            }
        }
        return Promise.reject(error);
    }
);

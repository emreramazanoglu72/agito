import { SESSION_COOKIE_MAX_AGE_SECONDS, SESSION_COOKIE_NAME } from './session-config';

const buildCookieAttributes = (maxAge: number) => {
    if (typeof window === 'undefined') {
        return `path=/; max-age=${maxAge}; samesite=strict`;
    }
    const isSecure = window.location.protocol === 'https:';
    return `path=/; max-age=${maxAge}; samesite=strict${isSecure ? '; secure' : ''}`;
};

export const setSessionCookie = (token: string) => {
    if (typeof document === 'undefined') {
        return;
    }

    const attributes = buildCookieAttributes(SESSION_COOKIE_MAX_AGE_SECONDS);
    document.cookie = `${SESSION_COOKIE_NAME}=${encodeURIComponent(token)}; ${attributes}`;
};

export const clearSessionCookie = () => {
    if (typeof document === 'undefined') {
        return;
    }

    const attributes = buildCookieAttributes(0);
    document.cookie = `${SESSION_COOKIE_NAME}=; ${attributes}`;
};

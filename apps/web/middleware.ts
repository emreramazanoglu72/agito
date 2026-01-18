import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE_NAME } from './src/lib/session-config';

const RATE_LIMIT_ENABLED = process.env.NODE_ENV === 'production';
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 80;
const RATE_LIMIT_STORE = new Map<string, { count: number; reset: number }>();

const SECURITY_HEADERS: Record<string, string> = {
    'x-frame-options': 'DENY',
    'x-content-type-options': 'nosniff',
    'x-xss-protection': '0',
    'referrer-policy': 'strict-origin-when-cross-origin',
    'permissions-policy': 'accelerometer=(), autoplay=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()',
    'strict-transport-security': 'max-age=63072000; includeSubDomains; preload',
    'content-security-policy': "default-src 'self'; script-src 'self' 'unsafe-inline' https://www.gstatic.com https://www.googletagmanager.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https://i.pravatar.cc https://avatars.githubusercontent.com https://ui-avatars.com; connect-src 'self' https://localhost:* http://localhost:*; frame-ancestors 'none'; base-uri 'self';",
    'cross-origin-opener-policy': 'same-origin',
    'cross-origin-resource-policy': 'same-origin',
};

const PUBLIC_PATHS = ['/', '/auth/login', '/auth/register', '/auth/forgot', '/favicon.ico', '/robots.txt'];
const STATIC_PREFIXES = ['/_next', '/static', '/assets', '/fonts', '/icons', '/images', '/public'];
const PROTECTED_PREFIXES = ['/dashboard'];

type RateLimitMeta = {
    limit: number;
    remaining: number;
    reset: number;
    exceeded: boolean;
    retryAfter?: number;
};

function getClientIdentifier(request: any) {
    const forwardedFor = request.headers.get('x-forwarded-for');
    if (forwardedFor) {
        return forwardedFor.split(',')[0].trim();
    }

    return (request.ip as any) ?? 'unknown';
}

function cleanupRateLimitStore() {
    if (RATE_LIMIT_STORE.size <= 500) {
        return;
    }

    const now = Date.now();
    for (const [key, value] of RATE_LIMIT_STORE) {
        if (value.reset < now) {
            RATE_LIMIT_STORE.delete(key);
        }
    }
}

function enforceRateLimit(request: NextRequest): RateLimitMeta | undefined {
    if (!RATE_LIMIT_ENABLED) {
        return undefined;
    }

    cleanupRateLimitStore();
    const identifier = getClientIdentifier(request);
    const now = Date.now();
    let bucket = RATE_LIMIT_STORE.get(identifier);
    if (!bucket || now > bucket.reset) {
        bucket = { count: 0, reset: now + RATE_LIMIT_WINDOW_MS };
    }

    bucket.count += 1;
    RATE_LIMIT_STORE.set(identifier, bucket);

    const meta: RateLimitMeta = {
        limit: RATE_LIMIT_MAX_REQUESTS,
        remaining: Math.max(0, RATE_LIMIT_MAX_REQUESTS - bucket.count),
        reset: bucket.reset,
        exceeded: bucket.count > RATE_LIMIT_MAX_REQUESTS,
    };

    if (meta.exceeded) {
        meta.remaining = 0;
        meta.retryAfter = Math.ceil((bucket.reset - now) / 1000);
    }

    return meta;
}

function shouldSkipAuth(pathname: string) {
    if (PUBLIC_PATHS.includes(pathname)) {
        return true;
    }

    if (STATIC_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
        return true;
    }

    return false;
}

function requiresAuthentication(pathname: string) {
    if (shouldSkipAuth(pathname)) {
        return false;
    }

    return PROTECTED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

function sanitizeSearchParams(request: NextRequest) {
    const cloned = request.nextUrl.clone();
    const sanitizedParams = new URLSearchParams();
    let mutated = false;

    request.nextUrl.searchParams.forEach((value, key) => {
        const cleanedValue = value.replace(/[<>;"'`]/g, '').trim();
        sanitizedParams.set(key, cleanedValue);
        if (cleanedValue !== value) {
            mutated = true;
        }
    });

    if (!mutated) {
        return null;
    }

    cloned.search = sanitizedParams.toString();
    return cloned;
}

function detectLocale(request: NextRequest) {
    const header = request.headers.get('accept-language');
    if (!header) {
        return 'tr';
    }

    const preferred = header.split(',')[0].split(';')[0].trim();
    return preferred.split('-')[0] || 'tr';
}

function applySecurityHeaders(response: NextResponse) {
    Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
        response.headers.set(key, value);
    });
}

function applyCorsHeaders(response: NextResponse, request: NextRequest) {
    const origin = request.headers.get('origin') ?? '*';
    response.headers.set('access-control-allow-origin', origin);
    response.headers.set('access-control-allow-methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    response.headers.set('access-control-allow-headers', 'Content-Type,Authorization');
    response.headers.set('access-control-allow-credentials', 'true');
    response.headers.set('access-control-max-age', '86400');
}

function applyCacheHeaders(response: NextResponse, request: NextRequest) {
    const pathname = request.nextUrl.pathname;

    if (STATIC_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
        response.headers.set('cache-control', 'public, max-age=31536000, immutable');
        return;
    }

    if (pathname === '/' || pathname.startsWith('/auth')) {
        response.headers.set('cache-control', 'public, max-age=60, stale-while-revalidate=120');
        return;
    }

    if (request.method === 'GET') {
        response.headers.set('cache-control', 'no-cache');
    } else {
        response.headers.set('cache-control', 'no-store');
    }
}

type ResponseContext = {
    request: NextRequest;
    response: NextResponse;
    requestId: string;
    startTime: number;
    locale: string;
    rateLimit?: RateLimitMeta;
};

function finalizeResponse({ request, response, requestId, startTime, locale, rateLimit }: ResponseContext) {
    const duration = Date.now() - startTime;
    applySecurityHeaders(response);
    applyCorsHeaders(response, request);
    applyCacheHeaders(response, request);
    response.headers.set('x-request-id', requestId);
    response.headers.set('x-response-time', `${duration}ms`);
    response.headers.set('x-user-locale', locale);
    response.headers.set('x-client-ip', getClientIdentifier(request));
    response.cookies.set('preferred-language', locale, { path: '/', maxAge: 60 * 60 * 24 * 30 });

    if (rateLimit) {
        response.headers.set('x-rate-limit-limit', String(rateLimit.limit));
        response.headers.set('x-rate-limit-remaining', String(rateLimit.remaining));
        const resetSeconds = Math.max(0, Math.ceil((rateLimit.reset - Date.now()) / 1000));
        response.headers.set('x-rate-limit-reset', String(resetSeconds));
        if (rateLimit.exceeded && rateLimit.retryAfter !== undefined) {
            response.headers.set('retry-after', String(rateLimit.retryAfter));
        }
    }

    console.info(
        `[Middleware:${requestId}] ${request.method} ${request.nextUrl.pathname}${request.nextUrl.search} -> ${response.status} (${duration}ms) locale=${locale}`
    );

    return response;
}

export function middleware(request: NextRequest) {
    const startTime = Date.now();
    const headersRequestId = request.headers.get('x-request-id');
    const generatedId =
        typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : Math.random().toString(36).slice(2);
    const requestId = headersRequestId ?? generatedId;
    const locale = detectLocale(request);

    try {
        const sanitizedRedirect = sanitizeSearchParams(request);
        if (sanitizedRedirect) {
            const response = NextResponse.redirect(sanitizedRedirect);
            return finalizeResponse({ request, response, requestId, startTime, locale });
        }

        const pathname = request.nextUrl.pathname;
        const hasSession = Boolean(request.cookies.get(SESSION_COOKIE_NAME)?.value);

        if (pathname === '/' && hasSession) {
            const response = NextResponse.redirect(new URL('/dashboard', request.url));
            return finalizeResponse({ request, response, requestId, startTime, locale });
        }

        if (pathname === '/auth/login' && hasSession) {
            const response = NextResponse.redirect(new URL('/dashboard', request.url));
            return finalizeResponse({ request, response, requestId, startTime, locale });
        }

        if (requiresAuthentication(pathname) && !hasSession) {
            const response = NextResponse.redirect(new URL('/auth/login', request.url));
            return finalizeResponse({ request, response, requestId, startTime, locale });
        }

        const rateLimitMeta = enforceRateLimit(request);
        if (rateLimitMeta?.exceeded) {
            const response = NextResponse.json(
                { message: 'Çok fazla istek yaptınız, lütfen biraz bekleyin.', code: 'RATE_LIMIT_EXCEEDED' },
                { status: 429 }
            );
            return finalizeResponse({ request, response, requestId, startTime, locale, rateLimit: rateLimitMeta });
        }

        const response = NextResponse.next();
        return finalizeResponse({ request, response, requestId, startTime, locale, rateLimit: rateLimitMeta });
    } catch (error) {
        console.error(`[Middleware:${requestId}] Unhandled middleware error`, error);
        const response = NextResponse.json(
            { message: 'Sunucu içi hata (middleware)', code: 'MIDDLEWARE_ERROR' },
            { status: 500 }
        );
        return finalizeResponse({ request, response, requestId, startTime, locale });
    }
}

export const config = {
    matcher: ['/', '/auth/:path*', '/dashboard/:path*', '/favicon.ico', '/robots.txt'],
};

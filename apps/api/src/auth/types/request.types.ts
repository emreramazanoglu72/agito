import { Request } from 'express';

/**
 * JWT payload structure used for authentication
 */
export interface JwtPayload {
    sub: string;
    email: string;
    role: string;
    tenantId: string;
    iat?: number;
    exp?: number;
}

/**
 * Express Request with authenticated user payload
 * Use this instead of `@Req() req: any` in controllers
 */
export interface AuthenticatedRequest extends Request {
    user: JwtPayload;
}

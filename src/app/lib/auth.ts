import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import crypto from 'crypto';

const getJwtSecret = (): Uint8Array => {
  if (!process.env.JWT_SECRET) {
    console.warn('No JWT_SECRET found in environment. Generating a temporary secret.');
    return crypto.randomBytes(32);
  }
  return new TextEncoder().encode(process.env.JWT_SECRET);
};

const JWT_SECRET = getJwtSecret();
const JWT_EXPIRATION = 60 * 60 * 2; // 2 hours in seconds

export interface SessionPayload {
  address: string;
  networkId: number;
  name: string;
  exp?: number;
  iat?: number;
  jti?: string;
}

export async function createSecureSessionToken(sessionData: {
  address: string;
  networkId: number;
  name: string;
}): Promise<string> {
  const tokenId = crypto.randomBytes(16).toString('hex');
  const timestamp = Math.floor(Date.now() / 1000);
  const expirationTime = timestamp + JWT_EXPIRATION;
  
  const tokenHash = crypto.createHash('sha256')
    .update(`${sessionData.address}:${tokenId}:${timestamp}`)
    .digest('hex');
  
  return await new SignJWT({ 
    address: sessionData.address,
    networkId: sessionData.networkId,
    name: sessionData.name || 'Unknown Wallet',
    jti: tokenHash
  })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setIssuedAt(timestamp)
    .setExpirationTime(expirationTime)
    .setJti(tokenId)
    .setNotBefore(timestamp)
    .sign(JWT_SECRET);
}

export async function validateSession(token: string): Promise<boolean> {
  try {
    const { payload } = await jwtVerify<SessionPayload>(token, JWT_SECRET, {
      algorithms: ['HS256']
    });

    if (!payload.address || !payload.jti) {
      return false;
    }

    const currentTime = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < currentTime) {
      return false;
    }

    return true;
  } catch (error) {
    console.error('Session validation error:', error);
    return false;
  }
}

export async function getSessionData(token?: string): Promise<SessionPayload | null> {
  if (!token) {
    try {
      const cookieStore = await cookies();
      const sessionCookie = cookieStore.get('wallet_session');
      token = sessionCookie?.value;
    } catch (error) {
      console.error('Error accessing cookies:', error);
      return null;
    }
  }

  if (!token) {
    return null;
  }

  try {
    const { payload } = await jwtVerify<SessionPayload>(token, JWT_SECRET, {
      algorithms: ['HS256']
    });
    
    const currentTime = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < currentTime) {
      return null;
    }
    
    return payload;
  } catch (error) {
    console.error('Error extracting session data:', error);
    return null;
  }
}

export async function refreshSessionToken(token: string): Promise<string | null> {
  try {
    const sessionData = await getSessionData(token);
    
    if (!sessionData) {
      return null;
    }
    
    return await createSecureSessionToken({
      address: sessionData.address,
      networkId: sessionData.networkId,
      name: sessionData.name
    });
  } catch (error) {
    console.error('Error refreshing session token:', error);
    return null;
  }
}

export async function validateSessionFromCookies(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('wallet_session');
    
    if (!sessionCookie?.value) {
      return false;
    }
    
    return await validateSession(sessionCookie.value);
  } catch (error) {
    console.error('Session validation error:', error);
    return false;
  }
}

export function shouldRefreshToken(tokenPayload: SessionPayload): boolean {
  if (!tokenPayload.exp) return true;
  
  const currentTime = Math.floor(Date.now() / 1000);
  const timeRemaining = tokenPayload.exp - currentTime;
  
  return timeRemaining < (JWT_EXPIRATION / 4); // Refresh if less than 25% of lifetime remains
}

export function generateCsrfToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function validateCsrfToken(providedToken: string, storedToken: string): boolean {
  try {
    return crypto.timingSafeEqual(
      Buffer.from(providedToken, 'hex'), 
      Buffer.from(storedToken, 'hex')
    );
  } catch (error) {
    console.error('CSRF token validation error:', error);
    return false;
  }
}

export class RateLimiter {
  private static instances: Map<string, RateLimiter> = new Map();
  private tokens: number;
  private lastRefill: number;
  private readonly capacity: number;
  private readonly fillRate: number;

  private constructor(
    capacity: number = 10, 
    fillRate: number = 1,
    initialTokens?: number
  ) {
    this.capacity = capacity;
    this.fillRate = fillRate;
    this.tokens = initialTokens ?? capacity;
    this.lastRefill = Date.now();
  }

  public static getInstance(
    key: string, 
    capacity: number = 10, 
    fillRate: number = 1
  ): RateLimiter {
    if (!this.instances.has(key)) {
      this.instances.set(key, new RateLimiter(capacity, fillRate));
    }
    return this.instances.get(key)!;
  }

  private refill(): void {
    const now = Date.now();
    const elapsedTime = (now - this.lastRefill) / 1000;
    const tokensToAdd = elapsedTime * this.fillRate;
    
    this.tokens = Math.min(this.capacity, this.tokens + tokensToAdd);
    this.lastRefill = now;
  }

  public tryConsume(tokens: number = 1): boolean {
    this.refill();
    
    if (this.tokens >= tokens) {
      this.tokens -= tokens;
      return true;
    }
    
    return false;
  }
}

export function validateOrigin(origin: string | null): boolean {
  if (!origin) return false;

  const ALLOWED_ORIGINS = [
    `https://${process.env.NEXT_PUBLIC_URL}`,
    `https://www.${process.env.NEXT_PUBLIC_URL}`,
    process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : null
  ].filter(Boolean);

  return ALLOWED_ORIGINS.includes(origin);
}

export function validateContentType(
  contentType: string | null, 
  allowedTypes: string[] = ['application/json']
): boolean {
  if (!contentType) return false;
  return allowedTypes.some(type => contentType.includes(type));
}
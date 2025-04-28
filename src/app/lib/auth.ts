import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import crypto from 'crypto';

const generateJwtSecret = (): Uint8Array => {
  if (!process.env.JWT_SECRET) {
    console.warn('No JWT_SECRET found. Generating a temporary secret.');
    return crypto.randomBytes(32);
  }
  return new TextEncoder().encode(process.env.JWT_SECRET);
};

const JWT_SECRET = generateJwtSecret();
const JWT_EXPIRATION = 60 * 60 * 2; 

export interface SessionPayload {
  address: string;
  networkId: number;
  name: string;
  exp?: number;
  iat?: number;
}

export async function createSecureSessionToken(sessionData: {
  address: string;
  networkId: number;
  name: string;
}): Promise<string> {
  return await new SignJWT({ 
    address: sessionData.address,
    networkId: sessionData.networkId,
    name: sessionData.name || 'Unknown Wallet',
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('2h')
    .sign(JWT_SECRET);
}

export async function validateSession(token: string): Promise<boolean> {
  try {
    const { payload } = await jwtVerify<SessionPayload>(token, JWT_SECRET, {
      algorithms: ['HS256']
    });


    if (!payload.address) {
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
    return payload;
  } catch (error) {
    console.error('Error extracting session data:', error);
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

export function generateCsrfToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function validateCsrfToken(providedToken: string, storedToken: string): boolean {
  return crypto.timingSafeEqual(
    Buffer.from(providedToken), 
    Buffer.from(storedToken)
  );
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
    'https://arpradio.media',
    'https://www.arpradio.media',
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
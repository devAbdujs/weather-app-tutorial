import { cookies } from 'next/headers';

export interface SessionData {
  telegram_id: string;
  profile_id: string;
  first_name: string;
  devMode?: boolean;
  target_exam?: string | null;
  stream?: string | null;
  iat?: number;
  exp?: number;
}

const getSecretKey = async (): Promise<CryptoKey> => {
  const token = process.env.SESSION_SECRET || process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('[Security] TELEGRAM_BOT_TOKEN or SESSION_SECRET must be configured in production.');
    }
    console.warn('[Security] Neither TELEGRAM_BOT_TOKEN nor SESSION_SECRET is set. Using dev fallback.');
    const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('dev-fallback-secret-key-32-bytes!'));
    return crypto.subtle.importKey('raw', hash, 'AES-GCM', false, ['encrypt', 'decrypt']);
  }
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token));
  return crypto.subtle.importKey('raw', hash, 'AES-GCM', false, ['encrypt', 'decrypt']);
};

function bufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

function hexToBuffer(hex: string): ArrayBuffer {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes.buffer;
}

export async function encryptSession(data: SessionData): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await getSecretKey();
  
  const now = Math.floor(Date.now() / 1000);
  const payload: SessionData = {
    ...data,
    iat: data.iat || now,
    exp: data.exp || (now + 60 * 60 * 24 * 30), // 30 days
  };

  const encoded = new TextEncoder().encode(JSON.stringify(payload));
  const encryptedBuf = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoded
  );
  
  return `${bufferToHex(iv.buffer)}:${bufferToHex(encryptedBuf)}`;
}

export async function decryptSession(encryptedStr: string): Promise<SessionData | null> {
  try {
    const parts = encryptedStr.split(':');
    if (parts.length !== 2) return null;
    
    const iv = hexToBuffer(parts[0]);
    const encryptedBuf = hexToBuffer(parts[1]);
    const key = await getSecretKey();
    
    const decryptedBuf = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      encryptedBuf
    );
    
    const decryptedStr = new TextDecoder().decode(decryptedBuf);
    const session = JSON.parse(decryptedStr) as SessionData;

    // Validate embedded expiration if present
    if (session.exp && Math.floor(Date.now() / 1000) > session.exp) {
      return null;
    }

    return session;
  } catch (err) {
    return null;
  }
}

export async function getServerSession(): Promise<SessionData | null> {
  const cookieStore = cookies();
  const sessionCookie = cookieStore.get('es_session');
  
  if (!sessionCookie?.value) return null;
  
  return decryptSession(sessionCookie.value);
}

/**
 * Returns cookie options for es_session, automatically configuring
 * domain: .<root-domain> in production for seamless Single Sign-On across subdomains.
 */
export function getSessionCookieOptions() {
  const isProd = process.env.NODE_ENV === 'production';
  let cookieDomain: string | undefined = undefined;

  if (isProd) {
    try {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://temari.top';
      const parsedHost = new URL(siteUrl).hostname;
      const parts = parsedHost.split('.');
      if (parts.length >= 2) {
        cookieDomain = `.${parts.slice(-2).join('.')}`;
      }
    } catch {}
  }

  return {
    httpOnly: true,
    secure: isProd,
    sameSite: (isProd ? 'none' : 'lax') as 'none' | 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30, // 30 days
    ...(cookieDomain ? { domain: cookieDomain } : {}),
  };
}

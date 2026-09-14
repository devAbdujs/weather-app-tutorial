import crypto from 'crypto';
import { cookies } from 'next/headers';

// Use the bot token to derive an encryption key (must be 32 bytes for aes-256-gcm)
const getSecretKey = () => {
  const token = process.env.TELEGRAM_BOT_TOKEN || 'dev-fallback-secret-key-32-bytes!';
  return crypto.scryptSync(token, 'ethio-scholar-salt', 32);
};

const ALGORITHM = 'aes-256-gcm';

export interface SessionData {
  telegram_id: string;
  profile_id: string;
  first_name: string;
}

export function encryptSession(data: SessionData): string {
  const iv = crypto.randomBytes(16);
  const key = getSecretKey();
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  
  return `${iv.toString('hex')}:${encrypted}:${authTag}`;
}

export function decryptSession(encryptedStr: string): SessionData | null {
  try {
    const [ivHex, encryptedHex, authTagHex] = encryptedStr.split(':');
    if (!ivHex || !encryptedHex || !authTagHex) return null;

    const iv = Buffer.from(ivHex, 'hex');
    const key = getSecretKey();
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));
    
    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return JSON.parse(decrypted) as SessionData;
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

import { cookies } from 'next/headers';

export interface SessionData {
  telegram_id: string;
  profile_id: string;
  first_name: string;
  target_exam?: string | null;
  stream?: string | null;
}

const getSecretKey = async (): Promise<CryptoKey> => {
  const token = process.env.TELEGRAM_BOT_TOKEN || 'dev-fallback-secret-key-32-bytes!';
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
  
  const encoded = new TextEncoder().encode(JSON.stringify(data));
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
    return JSON.parse(decryptedStr) as SessionData;
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

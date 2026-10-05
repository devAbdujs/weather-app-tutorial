import crypto from 'crypto';

interface ValidationOptions {
  /** Maximum allowable age of auth_date in seconds. Defaults to 86,400 (24 hours). Set to 0 to disable. */
  maxAgeSeconds?: number;
}

/**
 * Validates Telegram Mini App initData against the bot token.
 * Enforces Telegram HMAC-SHA256 signature verification, auth_date freshness (replay protection),
 * and constant-time comparison (side-channel timing attack protection).
 */
export function validateMiniAppInitData(
  initData: string,
  botToken: string,
  options?: ValidationOptions
): any {
  const urlParams = new URLSearchParams(initData);
  const hash = urlParams.get('hash');
  
  if (!hash) return null;
  
  urlParams.delete('hash');

  // Verify auth_date freshness (replay attack prevention)
  const authDateStr = urlParams.get('auth_date');
  if (!authDateStr) return null;

  const authDate = parseInt(authDateStr, 10);
  if (isNaN(authDate)) return null;

  const maxAge = options?.maxAgeSeconds ?? 86400; // 24 hours default
  if (maxAge > 0) {
    const now = Math.floor(Date.now() / 1000);
    // Discard if older than maxAge or more than 60s in the future (clock skew)
    if (now - authDate > maxAge || authDate - now > 60) {
      return null;
    }
  }

  const params = Array.from(urlParams.entries());
  params.sort((a, b) => a[0].localeCompare(b[0]));
  const dataCheckString = params.map(([key, value]) => `${key}=${value}`).join('\n');

  const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
  const calculatedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

  // Constant-time comparison to prevent timing side-channel attacks
  try {
    const calculatedBuffer = Buffer.from(calculatedHash, 'hex');
    const hashBuffer = Buffer.from(hash, 'hex');
    if (calculatedBuffer.length !== hashBuffer.length || !crypto.timingSafeEqual(calculatedBuffer, hashBuffer)) {
      return null;
    }
  } catch {
    return null;
  }

  const userString = urlParams.get('user');
  if (userString) {
    try {
      return JSON.parse(userString);
    } catch {
      return null;
    }
  }
  
  return true; // Valid but no user object
}

/**
 * Validates Telegram Login Widget data object.
 * Enforces Telegram SHA256 bot-token hash verification, auth_date freshness,
 * and constant-time comparison.
 */
export function validateWebWidgetData(
  webData: any,
  botToken: string,
  options?: ValidationOptions
): any {
  if (!webData || typeof webData !== 'object') return null;
  const { hash, ...userData } = webData;
  if (!hash) return null;

  // Verify auth_date freshness
  if (!userData.auth_date) return null;
  const authDate = parseInt(String(userData.auth_date), 10);
  if (isNaN(authDate)) return null;

  const maxAge = options?.maxAgeSeconds ?? 86400; // 24 hours default
  if (maxAge > 0) {
    const now = Math.floor(Date.now() / 1000);
    if (now - authDate > maxAge || authDate - now > 60) {
      return null;
    }
  }
  
  const checkString = Object.keys(userData)
    .sort()
    .map(k => `${k}=${userData[k as keyof typeof userData]}`)
    .join('\n');

  const secretKey = crypto.createHash('sha256').update(botToken).digest();
  const calculatedHash = crypto.createHmac('sha256', secretKey).update(checkString).digest('hex');

  // Constant-time comparison to prevent timing side-channel attacks
  try {
    const calculatedBuffer = Buffer.from(calculatedHash, 'hex');
    const hashBuffer = Buffer.from(hash, 'hex');
    if (calculatedBuffer.length !== hashBuffer.length || !crypto.timingSafeEqual(calculatedBuffer, hashBuffer)) {
      return null;
    }
  } catch {
    return null;
  }
  
  return userData;
}

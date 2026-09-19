import crypto from 'crypto';

export function validateMiniAppInitData(initData: string, botToken: string): any {
  const urlParams = new URLSearchParams(initData);
  const hash = urlParams.get('hash');
  
  if (!hash) return null;
  
  urlParams.delete('hash');

  const params = Array.from(urlParams.entries());
  params.sort((a, b) => a[0].localeCompare(b[0]));
  const dataCheckString = params.map(([key, value]) => `${key}=${value}`).join('\n');

  const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
  const calculatedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

  if (calculatedHash !== hash) return null;

  const userString = urlParams.get('user');
  if (userString) return JSON.parse(userString);
  
  return true; // Valid but no user object
}

export function validateWebWidgetData(webData: any, botToken: string): any {
  const { hash, ...userData } = webData;
  if (!hash) return null;
  
  const checkString = Object.keys(userData)
    .sort()
    .map(k => `${k}=${userData[k as keyof typeof userData]}`)
    .join('\n');

  const secretKey = crypto.createHash('sha256').update(botToken).digest();
  const calculatedHash = crypto.createHmac('sha256', secretKey).update(checkString).digest('hex');

  if (calculatedHash !== hash) return null;
  
  return userData;
}

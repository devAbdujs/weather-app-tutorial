/**
 * @jest-environment node
 */

import { validateMiniAppInitData, validateWebWidgetData } from '@/lib/telegramAuth';
import crypto from 'crypto';

describe('Telegram Auth Validation', () => {
  const BOT_TOKEN = '123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11';

  it('should validate legitimate Mini App initData', () => {
    // Generate valid signature mock
    const initDataString = 'query_id=AAHdF6IQAAAAAN0XohC-1234&user=%7B%22id%22%3A123456789%2C%22first_name%22%3A%22John%22%2C%22last_name%22%3A%22Doe%22%2C%22username%22%3A%22johndoe%22%2C%22language_code%22%3A%22en%22%7D&auth_date=1610000000';
    
    // Calculate what the valid hash should be for this test string
    const urlParams = new URLSearchParams(initDataString);
    const params = Array.from(urlParams.entries());
    params.sort((a, b) => a[0].localeCompare(b[0]));
    const dataCheckString = params.map(([key, value]) => `${key}=${value}`).join('\n');
    
    const secretKey = crypto.createHmac('sha256', 'WebAppData').update(BOT_TOKEN).digest();
    const validHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

    const finalInitData = `${initDataString}&hash=${validHash}`;

    const user = validateMiniAppInitData(finalInitData, BOT_TOKEN);
    expect(user).toBeDefined();
    expect(user.id).toBe(123456789);
    expect(user.first_name).toBe('John');
  });

  it('should reject tampered Mini App initData', () => {
    const tamperedInitData = 'query_id=AAHdF6IQAAAAAN0XohC-1234&user=%7B%22id%22%3A999999999%7D&auth_date=1610000000&hash=fakehash123';
    const user = validateMiniAppInitData(tamperedInitData, BOT_TOKEN);
    expect(user).toBeNull();
  });

  it('should reject Mini App initData signed with wrong token', () => {
    const initDataString = 'query_id=test&auth_date=123';
    const secretKey = crypto.createHmac('sha256', 'WebAppData').update('WRONG_TOKEN').digest();
    const hash = crypto.createHmac('sha256', secretKey).update('auth_date=123\nquery_id=test').digest('hex');
    
    const user = validateMiniAppInitData(`${initDataString}&hash=${hash}`, BOT_TOKEN);
    expect(user).toBeNull();
  });

  it('should validate legitimate Web Widget webData', () => {
    const webData = {
      id: 123456789,
      first_name: 'John',
      username: 'johndoe',
      auth_date: 1610000000,
    };
    
    const checkString = Object.keys(webData)
      .sort()
      .map(k => `${k}=${webData[k as keyof typeof webData]}`)
      .join('\n');
      
    const secretKey = crypto.createHash('sha256').update(BOT_TOKEN).digest();
    const validHash = crypto.createHmac('sha256', secretKey).update(checkString).digest('hex');

    const finalWebData = { ...webData, hash: validHash };
    
    const user = validateWebWidgetData(finalWebData, BOT_TOKEN);
    expect(user).toBeDefined();
    expect(user.id).toBe(123456789);
  });
});

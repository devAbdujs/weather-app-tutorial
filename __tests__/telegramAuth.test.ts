/**
 * @jest-environment node
 */

import { validateMiniAppInitData, validateWebWidgetData } from '@/lib/telegramAuth';
import crypto from 'crypto';

describe('Telegram Auth Validation', () => {
  const BOT_TOKEN = '123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11';

  function signMiniApp(paramsObj: Record<string, string>, token: string): string {
    const params = Object.entries(paramsObj).sort((a, b) => a[0].localeCompare(b[0]));
    const dataCheckString = params.map(([k, v]) => `${k}=${v}`).join('\n');
    const secretKey = crypto.createHmac('sha256', 'WebAppData').update(token).digest();
    const hash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');
    const qs = new URLSearchParams(paramsObj);
    qs.set('hash', hash);
    return qs.toString();
  }

  function signWebWidget(dataObj: Record<string, any>, token: string): any {
    const checkString = Object.keys(dataObj)
      .sort()
      .map(k => `${k}=${dataObj[k]}`)
      .join('\n');
    const secretKey = crypto.createHash('sha256').update(token).digest();
    const hash = crypto.createHmac('sha256', secretKey).update(checkString).digest('hex');
    return { ...dataObj, hash };
  }

  it('should validate legitimate Mini App initData with fresh auth_date', () => {
    const now = Math.floor(Date.now() / 1000);
    const validInitData = signMiniApp({
      query_id: 'AAHdF6IQAAAAAN0XohC-1234',
      user: JSON.stringify({ id: 123456789, first_name: 'John', last_name: 'Doe', username: 'johndoe' }),
      auth_date: String(now),
    }, BOT_TOKEN);

    const user = validateMiniAppInitData(validInitData, BOT_TOKEN);
    expect(user).toBeDefined();
    expect(user.id).toBe(123456789);
    expect(user.first_name).toBe('John');
  });

  it('should reject expired Mini App initData (> 24 hours old)', () => {
    const twoDaysAgo = Math.floor(Date.now() / 1000) - (2 * 86400);
    const expiredInitData = signMiniApp({
      query_id: 'AAHdF6IQAAAAAN0XohC-1234',
      user: JSON.stringify({ id: 123456789, first_name: 'John' }),
      auth_date: String(twoDaysAgo),
    }, BOT_TOKEN);

    const user = validateMiniAppInitData(expiredInitData, BOT_TOKEN);
    expect(user).toBeNull();
  });

  it('should reject Mini App initData without auth_date', () => {
    const paramsObj: Record<string, string> = {
      query_id: 'AAHdF6IQAAAAAN0XohC-1234',
      user: JSON.stringify({ id: 123456789, first_name: 'John' }),
    };
    const initDataWithoutAuthDate = signMiniApp(paramsObj, BOT_TOKEN);

    const user = validateMiniAppInitData(initDataWithoutAuthDate, BOT_TOKEN);
    expect(user).toBeNull();
  });

  it('should reject tampered Mini App initData', () => {
    const now = Math.floor(Date.now() / 1000);
    const validInitData = signMiniApp({
      query_id: 'AAHdF6IQAAAAAN0XohC-1234',
      user: JSON.stringify({ id: 123456789, first_name: 'John' }),
      auth_date: String(now),
    }, BOT_TOKEN);

    // Tamper with user payload
    const tampered = validInitData.replace('123456789', '999999999');
    const user = validateMiniAppInitData(tampered, BOT_TOKEN);
    expect(user).toBeNull();
  });

  it('should reject Mini App initData signed with wrong token', () => {
    const now = Math.floor(Date.now() / 1000);
    const initDataWrongToken = signMiniApp({
      query_id: 'test',
      auth_date: String(now),
    }, 'WRONG_BOT_TOKEN');

    const user = validateMiniAppInitData(initDataWrongToken, BOT_TOKEN);
    expect(user).toBeNull();
  });

  it('should validate legitimate Web Widget webData with fresh auth_date', () => {
    const now = Math.floor(Date.now() / 1000);
    const validWebData = signWebWidget({
      id: 123456789,
      first_name: 'John',
      username: 'johndoe',
      auth_date: now,
    }, BOT_TOKEN);

    const user = validateWebWidgetData(validWebData, BOT_TOKEN);
    expect(user).toBeDefined();
    expect(user.id).toBe(123456789);
  });

  it('should reject expired Web Widget webData (> 24 hours old)', () => {
    const twoDaysAgo = Math.floor(Date.now() / 1000) - (2 * 86400);
    const expiredWebData = signWebWidget({
      id: 123456789,
      first_name: 'John',
      auth_date: twoDaysAgo,
    }, BOT_TOKEN);

    const user = validateWebWidgetData(expiredWebData, BOT_TOKEN);
    expect(user).toBeNull();
  });

  it('should reject Web Widget webData with invalid hash', () => {
    const now = Math.floor(Date.now() / 1000);
    const validWebData = signWebWidget({
      id: 123456789,
      first_name: 'John',
      auth_date: now,
    }, BOT_TOKEN);

    validWebData.hash = '0000000000000000000000000000000000000000000000000000000000000000';
    const user = validateWebWidgetData(validWebData, BOT_TOKEN);
    expect(user).toBeNull();
  });
});

/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { POST, GET } from '@/app/api/auth/logout/route';

describe('/api/auth/logout route', () => {
  it('clears session and portal cookies on POST request', async () => {
    const req = new NextRequest('http://localhost:3000/api/auth/logout', {
      method: 'POST',
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);

    const setCookieHeaders = res.headers.get('set-cookie');
    expect(setCookieHeaders).toContain('es_session=');
    expect(setCookieHeaders).toContain('temari_manual_logout=true');
  });

  it('redirects to /?logged_out=1 and sets deletion cookies on GET request', async () => {
    const req = new NextRequest('http://localhost:3000/api/auth/logout', {
      method: 'GET',
    });

    const res = await GET(req);
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toContain('/?logged_out=1');

    const setCookieHeaders = res.headers.get('set-cookie');
    expect(setCookieHeaders).toContain('es_session=');
    expect(setCookieHeaders).toContain('temari_manual_logout=true');
  });
});

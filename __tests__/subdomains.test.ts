import { parseSubdomain, getSubdomainUrl, SUBDOMAIN_CONFIGS } from '@/lib/subdomains';

describe('Multi-Subdomain Architecture Suite', () => {
  describe('parseSubdomain', () => {
    it('detects entrance subdomain across domains and ports', () => {
      expect(parseSubdomain('entrance.temari.top')).toBe('entrance');
      expect(parseSubdomain('entrance.temari.app')).toBe('entrance');
      expect(parseSubdomain('entrance.localhost:3000')).toBe('entrance');
      expect(parseSubdomain('euee.temari.top')).toBe('entrance');
    });

    it('detects freshman subdomain across domains and ports', () => {
      expect(parseSubdomain('freshman.temari.top')).toBe('freshman');
      expect(parseSubdomain('freshman.localhost:3000')).toBe('freshman');
      expect(parseSubdomain('firstyear.temari.top')).toBe('freshman');
    });

    it('detects exit exam subdomain across domains and ports', () => {
      expect(parseSubdomain('exit.temari.top')).toBe('exit');
      expect(parseSubdomain('exit.localhost:3000')).toBe('exit');
      expect(parseSubdomain('exitexam.temari.top')).toBe('exit');
    });

    it('defaults to root for naked domains and localhost', () => {
      expect(parseSubdomain('temari.top')).toBe('root');
      expect(parseSubdomain('www.temari.top')).toBe('root');
      expect(parseSubdomain('localhost:3000')).toBe('root');
      expect(parseSubdomain(null)).toBe('root');
      expect(parseSubdomain(undefined)).toBe('root');
    });
  });

  describe('SUBDOMAIN_CONFIGS', () => {
    it('provides complete metadata and subject arrays for all portals', () => {
      const portals = ['entrance', 'freshman', 'exit', 'root'] as const;
      for (const p of portals) {
        const config = SUBDOMAIN_CONFIGS[p];
        expect(config).toBeDefined();
        expect(config.label).toBeTruthy();
        expect(config.headline).toBeTruthy();
        expect(config.metaTitle).toContain('Temari');
        expect(config.metaDescription.length).toBeGreaterThan(20);
        expect(config.subjects.length).toBeGreaterThan(0);
      }
    });

    it('properly scopes targetExam for exam portals', () => {
      expect(SUBDOMAIN_CONFIGS.entrance.targetExam).toBe('entrance');
      expect(SUBDOMAIN_CONFIGS.freshman.targetExam).toBe('freshman');
      expect(SUBDOMAIN_CONFIGS.exit.targetExam).toBe('exit');
      expect(SUBDOMAIN_CONFIGS.root.targetExam).toBeNull();
    });
  });

  describe('getSubdomainUrl', () => {
    const originalEnv = process.env.NEXT_PUBLIC_SITE_URL;

    afterEach(() => {
      process.env.NEXT_PUBLIC_SITE_URL = originalEnv;
    });

    it('constructs correct subdomain URLs in production', () => {
      process.env.NEXT_PUBLIC_SITE_URL = 'https://temari.top';
      expect(getSubdomainUrl('entrance')).toBe('https://entrance.temari.top');
      expect(getSubdomainUrl('freshman')).toBe('https://freshman.temari.top');
      expect(getSubdomainUrl('exit')).toBe('https://exit.temari.top');
      expect(getSubdomainUrl('root')).toBe('https://temari.top');
    });

    it('appends path appropriately', () => {
      process.env.NEXT_PUBLIC_SITE_URL = 'https://temari.top';
      expect(getSubdomainUrl('entrance', '/dashboard')).toBe('https://entrance.temari.top/dashboard');
    });
  });
});

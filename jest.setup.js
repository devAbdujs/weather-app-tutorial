// jest.setup.js — plain JavaScript, no TypeScript types allowed here

// Prevent "No Gemini API keys found" warning during test runs
process.env.gemini_api_key_dummy = 'test-dummy-key';

require('@testing-library/jest-dom');

// ── JSDOM shims ───────────────────────────────────────────────────────────────
if (typeof window !== 'undefined') {
  // matchMedia is not implemented in JSDOM
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(function(query) {
      return {
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      };
    }),
  });

  // scrollTo is not implemented in JSDOM
  Element.prototype.scrollTo = jest.fn();

  // Mock global fetch so UI component tests don't hit the network
  global.fetch = jest.fn(function() {
    return Promise.resolve(
      new Response(JSON.stringify({}), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );
  });
}

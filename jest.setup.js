require("dotenv").config({ path: ".env.local" });
import '@testing-library/jest-dom'

// Mock matchMedia which is not implemented in JSDOM
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // Deprecated
    removeListener: jest.fn(), // Deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock Element.scrollTo which is not implemented in JSDOM
Element.prototype.scrollTo = jest.fn();


// Mock global fetch for UI components
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
  })
);

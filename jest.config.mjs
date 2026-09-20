import nextJest from 'next/jest.js';

const createJestConfig = nextJest({
  // Load next.config.js and .env files in the test environment
  dir: './',
});

/** @type {import('jest').Config} */
const config = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],

  // Default: jsdom for component tests
  testEnvironment: 'jest-environment-jsdom',

  // Skip e2e (Playwright) and node_modules
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/.next/',
    '<rootDir>/e2e/',
  ],

  // Path alias: @/ → src/
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
};

// createJestConfig is exported this way to ensure that next/jest can load
// the Next.js config which is async
export default createJestConfig(config);

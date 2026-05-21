// jest.config.js — Troca Mobile
module.exports = {
  preset:                 'jest-expo',
  testEnvironment:        'jsdom',
  setupFilesAfterEnv:     ['@testing-library/jest-native/extend-expect'],
  transformIgnorePatterns: [],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  collectCoverageFrom: [
    'hooks/**/*.ts',
    'store/**/*.ts',
    'lib/**/*.ts',
    '!**/*.d.ts',
  ],
};

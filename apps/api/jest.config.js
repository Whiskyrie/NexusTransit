/**
 * Jest Configuration for NexusTransit API
 * Optimized for memory efficiency
 */
const baseConfig = require('../../jest.config.base');

module.exports = {
  ...baseConfig,
  rootDir: 'src',
  testRegex: undefined, // Override base config
  testMatch: ['**/*.spec.ts'],
  transform: {
    '^.+\\.(t|j)s$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/../tsconfig.json',
        diagnostics: {
          ignoreCodes: [151002],
        },
      },
    ],
  },
  moduleNameMapper: {
    // Specific package mappings (folder names differ from npm names)
    '^@nexus/geo-services$': '<rootDir>/../../../packages/geoServices/src',
    '^@nexus/geo-services/(.*)$': '<rootDir>/../../../packages/geoServices/src/$1',
    '^@nexus/rate-limit$': '<rootDir>/../../../packages/rate-limit/src',
    '^@nexus/rate-limit/(.*)$': '<rootDir>/../../../packages/rate-limit/src/$1',
    // Generic mapping for other packages
    '^@nexus/(.*)$': '<rootDir>/../../../packages/$1/src',
    '^@/(.*)$': '<rootDir>/$1',
    '^@/common/(.*)$': '<rootDir>/common/$1',
    '^@/config/(.*)$': '<rootDir>/config/$1',
    '^@/modules/(.*)$': '<rootDir>/modules/$1',
    '^@/shared/(.*)$': '<rootDir>/shared/$1',
  },
  collectCoverageFrom: ['**/*.(t|j)s'],
  coverageDirectory: '../coverage',
  // Memory optimizations for API tests
  maxWorkers: 2,
  workerIdleMemoryLimit: '512MB',
  testTimeout: 30000,
  detectOpenHandles: true,
  // Clear state between tests
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
};

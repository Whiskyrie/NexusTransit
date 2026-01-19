/**
 * Base Jest Configuration for NexusTransit Monorepo
 *
 * Optimized for low-memory environments (8GB RAM)
 * Individual packages can extend this configuration
 */

module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",

  // Memory optimization
  maxWorkers: process.env.CI ? 2 : "50%",
  workerIdleMemoryLimit: "512MB",

  // Performance optimization
  globals: {
    "ts-jest": {
      isolatedModules: true,
      tsconfig: {
        types: ["jest", "node"],
      },
    },
  },

  // File patterns
  moduleFileExtensions: ["js", "json", "ts"],
  testRegex: ".*\\.spec\\.ts$",

  // Transform
  transform: {
    "^.+\\.(t|j)s$": "ts-jest",
  },

  // Coverage
  collectCoverageFrom: [
    "**/*.(t|j)s",
    "!**/*.d.ts",
    "!**/node_modules/**",
    "!**/dist/**",
    "!**/coverage/**",
    "!**/*.config.js",
    "!**/index.ts",
  ],

  coverageDirectory: "./coverage",

  // Timeouts
  testTimeout: 30000,

  // Clear cache before running
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,

  // Verbose output
  verbose: true,
};

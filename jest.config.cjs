module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.ts', '**/*.spec.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    'cli/**/*.ts',
    '!src/**/*.d.ts',
    '!src/types/**/*',
  ],
  coveragePathIgnorePatterns: ['/node_modules/', '/tests/', '/dist/'],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  moduleFileExtensions: ['ts', 'js', 'json'],
  verbose: true,
  transformIgnorePatterns: [
    'node_modules/(?!(axios-cookiejar-support|http-cookie-agent)/)',
  ],
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        isolatedModules: true,
      },
    ],
  },
};

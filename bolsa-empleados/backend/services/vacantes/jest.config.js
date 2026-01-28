module.exports = {
  testEnvironment: 'node',
  coverageDirectory: 'coverage',
  testMatch: ['**/__tests__/**/*.test.js'],
  verbose: true,
  testTimeout: 30000,
  setupFilesAfterEnv: ['./__tests__/setup.js']
};

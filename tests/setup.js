/**
 * Jest setup file - runs before all tests
 */

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.GROQ_API_KEY = 'test-key';
process.env.LOG_LEVEL = 'error';

// Global test utilities
global.testUtils = {
  /**
   * Wait for specified time (useful for async testing)
   */
  wait: (ms) => new Promise(resolve => setTimeout(resolve, ms)),
  
  /**
   * Generate random test data
   */
  randomString: (length = 10) => {
    return Math.random().toString(36).substring(2, length + 2);
  },
  
  /**
   * Create test request payload
   */
  createTestRequest: (overrides = {}) => {
    return {
      topic: 'test topic for content generation',
      platform: 'instagram',
      tone: 'casual',
      ...overrides
    };
  }
};

// Console override for cleaner test output
const originalConsole = global.console;
global.console = {
  ...originalConsole,
  log: process.env.NODE_ENV === 'test' ? jest.fn() : originalConsole.log,
  info: process.env.NODE_ENV === 'test' ? jest.fn() : originalConsole.info,
  warn: process.env.NODE_ENV === 'test' ? jest.fn() : originalConsole.warn,
  error: process.env.NODE_ENV === 'test' ? jest.fn() : originalConsole.error
};

// Mock external services
jest.mock('../src/utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn()
}));

// Increase timeout for AI operations
jest.setTimeout(15000);

import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';

// Mock environment variables for testing
process.env.NEXTAUTH_SECRET = 'test-secret-key-for-testing-purposes-only';
process.env.NEXTAUTH_URL = 'http://localhost:3000';
process.env.MONGODB_URI = 'mongodb://localhost:27017/test-invoice-generator';
process.env.REDIS_URL = 'redis://localhost:6379';
process.env.REDIS_HOST = 'localhost';
process.env.REDIS_PORT = '6379';

// Polyfill for Node.js APIs in test environment
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder as any;

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    refresh: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
  }),
  useSearchParams: () => ({
    get: jest.fn(),
  }),
  usePathname: () => '/test-path',
}));

// Mock Next.js headers
jest.mock('next/headers', () => ({
  headers: () => ({
    get: jest.fn().mockReturnValue('localhost'),
  }),
}));

// Mock NextAuth
jest.mock('next-auth', () => ({
  default: jest.fn(),
}));

// Mock Redis
jest.mock('@/lib/redis', () => ({
  cache: {
    get: jest.fn(),
    set: jest.fn(),
    setJson: jest.fn(),
    getJson: jest.fn(),
    del: jest.fn(),
    exists: jest.fn(),
    keys: jest.fn(),
    clearPattern: jest.fn(),
    ttl: jest.fn(),
    initialize: jest.fn(),
  },
}));

// Mock MongoDB
jest.mock('@/lib/mongodb', () => ({
  __esModule: true,
  default: jest.fn().mockResolvedValue({}),
}));

// Mock file operations for testing
jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  writeFileSync: jest.fn(),
  readFileSync: jest.fn(),
}));

// Clear all mocks after each test
afterEach(() => {
  jest.clearAllMocks();
});

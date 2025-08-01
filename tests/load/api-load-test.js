import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';

// Test configuration
export const options = {
  stages: [
    { duration: '1m', target: 10 }, // Ramp up to 10 users
    { duration: '2m', target: 10 }, // Stay at 10 users
    { duration: '1m', target: 20 }, // Ramp up to 20 users
    { duration: '2m', target: 20 }, // Stay at 20 users
    { duration: '1m', target: 0 }, // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests should be below 500ms
    http_req_failed: ['rate<0.1'], // Error rate should be below 10%
    cache_hit_rate: ['rate>0.8'], // Cache hit rate should be above 80%
  },
};

// Custom metrics
const cacheHits = new Counter('cache_hits');
const cacheMisses = new Counter('cache_misses');
const cacheHitRate = new Rate('cache_hit_rate');
const responseTime = new Trend('response_time');

const BASE_URL = 'http://localhost:3000';

// Test data
const testUsers = [
  { email: 'test1@example.com', password: 'password123' },
  { email: 'test2@example.com', password: 'password123' },
];

export function setup() {
  // Setup test data if needed
  console.log('Setting up load test...');
  return { baseUrl: BASE_URL };
}

export default function (data) {
  const baseUrl = data.baseUrl;

  // Test different API endpoints
  testDashboardAPI(baseUrl);
  sleep(1);

  testClientsAPI(baseUrl);
  sleep(1);

  testProductsAPI(baseUrl);
  sleep(1);

  testInvoicesAPI(baseUrl);
  sleep(2);
}

function testDashboardAPI(baseUrl) {
  const response = http.get(`${baseUrl}/api/dashboard`, {
    headers: {
      'Content-Type': 'application/json',
      // Add authentication headers if needed
    },
  });

  check(response, {
    'dashboard status is 200 or 401': r => r.status === 200 || r.status === 401,
    'dashboard response time < 1000ms': r => r.timings.duration < 1000,
  });

  trackCacheMetrics(response);
  responseTime.add(response.timings.duration);
}

function testClientsAPI(baseUrl) {
  const response = http.get(`${baseUrl}/api/clients?page=1&limit=10`, {
    headers: {
      'Content-Type': 'application/json',
    },
  });

  check(response, {
    'clients status is 200 or 401': r => r.status === 200 || r.status === 401,
    'clients response time < 800ms': r => r.timings.duration < 800,
  });

  trackCacheMetrics(response);
  responseTime.add(response.timings.duration);
}

function testProductsAPI(baseUrl) {
  const response = http.get(`${baseUrl}/api/products?page=1&limit=10`, {
    headers: {
      'Content-Type': 'application/json',
    },
  });

  check(response, {
    'products status is 200 or 401': r => r.status === 200 || r.status === 401,
    'products response time < 800ms': r => r.timings.duration < 800,
  });

  trackCacheMetrics(response);
  responseTime.add(response.timings.duration);
}

function testInvoicesAPI(baseUrl) {
  const response = http.get(`${baseUrl}/api/invoices?page=1&limit=10`, {
    headers: {
      'Content-Type': 'application/json',
    },
  });

  check(response, {
    'invoices status is 200 or 401': r => r.status === 200 || r.status === 401,
    'invoices response time < 1000ms': r => r.timings.duration < 1000,
  });

  trackCacheMetrics(response);
  responseTime.add(response.timings.duration);
}

function trackCacheMetrics(response) {
  const cacheStatus = response.headers['X-Cache-Status'];

  if (cacheStatus === 'HIT') {
    cacheHits.add(1);
    cacheHitRate.add(true);
  } else if (cacheStatus === 'MISS') {
    cacheMisses.add(1);
    cacheHitRate.add(false);
  }
}

export function teardown(data) {
  console.log('Load test completed');
  console.log('Performance Summary:');
  console.log('- Check response times and error rates in the output above');
  console.log('- Cache hit rate should be above 80% for optimal performance');
}

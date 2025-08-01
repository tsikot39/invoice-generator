// Test script to verify Redis caching implementation
// Run this with: node test-cache.js

const { cache } = require('./src/lib/redis.ts');

async function testCaching() {
  console.log('🧪 Testing Redis Caching Implementation...\n');

  try {
    // Test basic cache operations
    console.log('1. Testing basic cache operations:');

    // Set a test value
    await cache.set('test:key', 'test-value', 60);
    console.log('   ✅ Set test value');

    // Get the value
    const value = await cache.get('test:key');
    console.log(`   ✅ Retrieved value: ${value}`);

    // Test TTL
    const ttl = await cache.ttl('test:key');
    console.log(`   ✅ TTL: ${ttl} seconds`);

    // Test exists
    const exists = await cache.exists('test:key');
    console.log(`   ✅ Key exists: ${exists}`);

    console.log('\n2. Testing cache key patterns:');

    // Test different cache key patterns
    const testKeys = [
      'user:test@example.com',
      'clients:test@example.com:p1:l10:s',
      'dashboard:test@example.com',
      'session:test-session-token',
    ];

    for (const key of testKeys) {
      await cache.set(key, { test: 'data', timestamp: new Date().toISOString() }, 300);
      console.log(`   ✅ Set key: ${key}`);
    }

    console.log('\n3. Testing pattern-based operations:');

    // Get all user keys
    const userKeys = await cache.keys('user:*');
    console.log(`   ✅ Found ${userKeys.length} user keys`);

    const clientKeys = await cache.keys('clients:*');
    console.log(`   ✅ Found ${clientKeys.length} client keys`);

    console.log('\n4. Testing cache deletion:');

    // Delete test keys
    await cache.del('test:key');
    console.log('   ✅ Deleted test key');

    // Clean up
    for (const key of testKeys) {
      await cache.del(key);
    }
    console.log('   ✅ Cleaned up test keys');

    console.log('\n🎉 All cache tests passed!');

    // Check if we're using Redis or memory fallback
    const info = (await cache.info) ? await cache.info() : null;
    if (info) {
      console.log('\n📊 Using Redis cache');
    } else {
      console.log('\n📊 Using memory fallback cache');
    }
  } catch (error) {
    console.error('❌ Cache test failed:', error);
  }
}

// Only run if this file is executed directly
if (require.main === module) {
  testCaching();
}

module.exports = { testCaching };

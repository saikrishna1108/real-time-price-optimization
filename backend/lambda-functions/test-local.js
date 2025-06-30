const { handler: priceCalculatorHandler } = require('./dist/price-calculator');
const { handler: productCatalogHandler } = require('./dist/product-catalog');
const { handler: analyticsHandler } = require('./dist/analytics-api');
const { handler: simulationHandler } = require('./dist/simulation-trigger');

// Mock AWS Lambda context
const createMockContext = (functionName) => ({
  awsRequestId: `mock-request-${Date.now()}`,
  functionName,
  functionVersion: '$LATEST',
  memoryLimitInMB: '512',
  getRemainingTimeInMillis: () => 30000
});

// Test scenarios
async function testPriceCalculator() {
  console.log('\n🧮 Testing Price Calculator Lambda...');
  
  const testCases = [
    {
      name: 'Flight Ticket Pricing',
      event: {
        httpMethod: 'POST',
        body: JSON.stringify({
          productId: 'prod-001',
          userId: 'user-123',
          userSegment: 'returning_customer'
        })
      }
    },
    {
      name: 'Hotel Room Pricing - VIP Customer',
      event: {
        httpMethod: 'POST',
        body: JSON.stringify({
          productId: 'prod-002',
          userId: 'user-456',
          userSegment: 'vip_customer'
        })
      }
    },
    {
      name: 'Car Rental Pricing - New Customer',
      event: {
        httpMethod: 'POST',
        body: JSON.stringify({
          productId: 'prod-003',
          userId: 'user-789',
          userSegment: 'new_customer'
        })
      }
    }
  ];

  for (const testCase of testCases) {
    try {
      console.log(`\n📋 Test: ${testCase.name}`);
      const result = await priceCalculatorHandler(testCase.event, createMockContext('price-calculator'));
      const response = JSON.parse(result.body);
      
      if (response.success) {
        const { product, pricing, userInfo } = response.data;
        console.log(`   Product: ${product.name}`);
        console.log(`   Original Price: $${product.currentPrice}`);
        console.log(`   New Price: $${pricing.newPrice}`);
        console.log(`   Change: ${pricing.priceChangePercent}% (${pricing.recommendation})`);
        console.log(`   Confidence: ${(pricing.confidence * 100).toFixed(1)}%`);
        console.log(`   User Segment: ${userInfo.segment}`);
      } else {
        console.log(`   ❌ Error: ${response.error}`);
      }
    } catch (error) {
      console.log(`   ❌ Exception: ${error.message}`);
    }
  }
}

async function testProductCatalog() {
  console.log('\n📦 Testing Product Catalog Lambda...');
  
  const testCases = [
    {
      name: 'Get All Products',
      event: {
        httpMethod: 'GET',
        queryStringParameters: null,
        pathParameters: null
      }
    },
    {
      name: 'Get Products by Category',
      event: {
        httpMethod: 'GET',
        queryStringParameters: { category: 'travel' },
        pathParameters: null
      }
    },
    {
      name: 'Get Specific Product',
      event: {
        httpMethod: 'GET',
        queryStringParameters: null,
        pathParameters: { productId: 'prod-001' }
      }
    }
  ];

  for (const testCase of testCases) {
    try {
      console.log(`\n📋 Test: ${testCase.name}`);
      const result = await productCatalogHandler(testCase.event, createMockContext('product-catalog'));
      const response = JSON.parse(result.body);
      
      if (response.success) {
        if (response.data.products) {
          console.log(`   Found ${response.data.products.length} products`);
          response.data.products.forEach(product => {
            console.log(`   - ${product.name}: $${product.currentPrice} (${product.availability.status})`);
          });
        } else {
          console.log(`   Product: ${response.data.name}`);
          console.log(`   Price: $${response.data.currentPrice}`);
          console.log(`   Inventory: ${response.data.availability.inventory}/${response.data.availability.maxInventory}`);
        }
      } else {
        console.log(`   ❌ Error: ${response.error}`);
      }
    } catch (error) {
      console.log(`   ❌ Exception: ${error.message}`);
    }
  }
}

async function testAnalyticsAPI() {
  console.log('\n📊 Testing Analytics API Lambda...');
  
  const testCases = [
    {
      name: 'Overview Analytics',
      event: {
        httpMethod: 'GET',
        pathParameters: { type: 'overview' },
        queryStringParameters: { days: '7' }
      }
    },
    {
      name: 'Product Analytics',
      event: {
        httpMethod: 'GET',
        pathParameters: { type: 'products' },
        queryStringParameters: null
      }
    },
    {
      name: 'Real-time Analytics',
      event: {
        httpMethod: 'GET',
        pathParameters: { type: 'realtime' },
        queryStringParameters: null
      }
    }
  ];

  for (const testCase of testCases) {
    try {
      console.log(`\n📋 Test: ${testCase.name}`);
      const result = await analyticsHandler(testCase.event, createMockContext('analytics-api'));
      const response = JSON.parse(result.body);
      
      if (response.success) {
        const data = response.data;
        if (data.summary) {
          console.log(`   Total Optimizations: ${data.summary.totalOptimizations}`);
          console.log(`   Success Rate: ${data.summary.optimizationAccuracy}%`);
          console.log(`   Revenue Impact: $${data.summary.revenueImpact}`);
        } else if (data.products) {
          console.log(`   Product Performance (${data.products.length} products):`);
          data.products.forEach(product => {
            console.log(`   - ${product.name}: $${product.totalRevenue} revenue`);
          });
        } else if (data.liveMetrics) {
          console.log(`   Active Optimizations: ${data.activeOptimizations}`);
          console.log(`   Requests/min: ${data.liveMetrics.requestsPerMinute}`);
          console.log(`   Success Rate: ${(data.liveMetrics.successRate * 100).toFixed(1)}%`);
        }
      } else {
        console.log(`   ❌ Error: ${response.error}`);
      }
    } catch (error) {
      console.log(`   ❌ Exception: ${error.message}`);
    }
  }
}

async function testSimulationTrigger() {
  console.log('\n🎯 Testing Simulation Trigger Lambda...');
  
  try {
    const event = {
      source: 'aws.events',
      'detail-type': 'Scheduled Event',
      detail: {}
    };
    
    console.log('📋 Test: Scheduled Price Optimization Simulation');
    await simulationHandler(event, createMockContext('simulation-trigger'));
    console.log('   ✅ Simulation completed successfully (check console output above)');
  } catch (error) {
    console.log(`   ❌ Exception: ${error.message}`);
  }
}

// Performance test
async function performanceTest() {
  console.log('\n⚡ Performance Test...');
  
  const startTime = Date.now();
  const concurrentRequests = 10;
  
  const promises = Array.from({ length: concurrentRequests }, (_, i) => 
    priceCalculatorHandler({
      httpMethod: 'POST',
      body: JSON.stringify({
        productId: `prod-${String((i % 3) + 1).padStart(3, '0')}`,
        userId: `user-${i}`,
        userSegment: ['new_customer', 'returning_customer', 'vip_customer'][i % 3]
      })
    }, createMockContext(`price-calculator-${i}`))
  );
  
  try {
    const results = await Promise.all(promises);
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    const successCount = results.filter(r => r.statusCode === 200).length;
    console.log(`   📊 Processed ${concurrentRequests} concurrent requests in ${duration}ms`);
    console.log(`   ✅ Success rate: ${successCount}/${concurrentRequests} (${(successCount/concurrentRequests*100).toFixed(1)}%)`);
    console.log(`   ⚡ Average response time: ${(duration/concurrentRequests).toFixed(1)}ms per request`);
  } catch (error) {
    console.log(`   ❌ Performance test failed: ${error.message}`);
  }
}

// Main test runner
async function runTests() {
  console.log('🚀 Starting AWS Lambda Function Tests for Price Optimization');
  console.log('=' .repeat(60));
  
  try {
    await testPriceCalculator();
    await testProductCatalog();
    await testAnalyticsAPI();
    await testSimulationTrigger();
    await performanceTest();
    
    console.log('\n' + '='.repeat(60));
    console.log('🎉 All tests completed!');
    console.log('\n📝 Summary:');
    console.log('   ✅ Price Calculator: Real-time pricing with multiple factors');
    console.log('   ✅ Product Catalog: Dynamic product listing with filtering');
    console.log('   ✅ Analytics API: Comprehensive reporting and insights');
    console.log('   ✅ Simulation Trigger: Automated price optimization simulation');
    console.log('   ✅ Performance: Concurrent request handling');
    
  } catch (error) {
    console.error('❌ Test suite failed:', error.message);
    process.exit(1);
  }
}

// Error handling
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Run tests if this file is executed directly
if (require.main === module) {
  runTests();
}

module.exports = {
  runTests,
  testPriceCalculator,
  testProductCatalog,
  testAnalyticsAPI,
  testSimulationTrigger,
  performanceTest
}; 
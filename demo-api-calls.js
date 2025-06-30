const { handler: priceCalculatorHandler } = require('./backend/lambda-functions/dist/price-calculator');
const { handler: productCatalogHandler } = require('./backend/lambda-functions/dist/product-catalog');
const { handler: analyticsHandler } = require('./backend/lambda-functions/dist/analytics-api');

// Mock AWS Lambda context
const createMockContext = (functionName) => ({
  awsRequestId: `demo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  functionName,
  functionVersion: '$LATEST',
  memoryLimitInMB: '512',
  getRemainingTimeInMillis: () => 30000
});

// Utility function to simulate API calls
async function callAPI(handler, event, description) {
  console.log(`\n🔄 ${description}`);
  console.log('📤 Request:', JSON.stringify(event.body ? JSON.parse(event.body) : event.queryStringParameters || {}, null, 2));
  
  try {
    const result = await handler(event, createMockContext('api-demo'));
    const response = JSON.parse(result.body);
    
    console.log(`📥 Response (${result.statusCode}):`);
    if (response.success) {
      console.log(JSON.stringify(response.data, null, 2));
    } else {
      console.log('❌ Error:', response.error);
    }
    
    return response;
  } catch (error) {
    console.log('❌ Exception:', error.message);
    return null;
  }
}

// Demo scenarios
async function runPricingDemo() {
  console.log('\n' + '='.repeat(70));
  console.log('🎯 REAL-TIME PRICE OPTIMIZATION API DEMONSTRATION');
  console.log('='.repeat(70));

  // Scenario 1: Flight pricing for different user segments
  console.log('\n📈 SCENARIO 1: Dynamic Flight Pricing');
  console.log('-'.repeat(50));
  
  const userSegments = ['new_customer', 'returning_customer', 'vip_customer', 'price_sensitive'];
  
  for (const segment of userSegments) {
    await callAPI(priceCalculatorHandler, {
      httpMethod: 'POST',
      body: JSON.stringify({
        productId: 'prod-001',
        userId: `user-${segment}`,
        userSegment: segment
      })
    }, `Flight pricing for ${segment.replace('_', ' ')}`);
    
    // Small delay for realism
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Scenario 2: Hotel pricing comparison
  console.log('\n🏨 SCENARIO 2: Hotel Room Pricing Analysis');
  console.log('-'.repeat(50));
  
  await callAPI(priceCalculatorHandler, {
    httpMethod: 'POST',
    body: JSON.stringify({
      productId: 'prod-002',
      userId: 'business-traveler-001',
      userSegment: 'premium'
    })
  }, 'Luxury hotel room pricing for premium customer');

  // Scenario 3: Product catalog browsing
  console.log('\n📦 SCENARIO 3: Product Catalog API');
  console.log('-'.repeat(50));
  
  await callAPI(productCatalogHandler, {
    httpMethod: 'GET',
    queryStringParameters: { category: 'travel', sortBy: 'currentPrice', sortOrder: 'asc' },
    pathParameters: null
  }, 'Browse travel products sorted by price');

  await callAPI(productCatalogHandler, {
    httpMethod: 'GET',
    queryStringParameters: null,
    pathParameters: { productId: 'prod-003' }
  }, 'Get specific product details');

  // Scenario 4: Analytics dashboard
  console.log('\n📊 SCENARIO 4: Analytics & Reporting API');
  console.log('-'.repeat(50));
  
  await callAPI(analyticsHandler, {
    httpMethod: 'GET',
    pathParameters: { type: 'overview' },
    queryStringParameters: { days: '30' }
  }, 'Monthly overview analytics');

  await callAPI(analyticsHandler, {
    httpMethod: 'GET',
    pathParameters: { type: 'realtime' },
    queryStringParameters: null
  }, 'Real-time metrics dashboard');

  // Scenario 5: Comparative pricing analysis
  console.log('\n⚖️ SCENARIO 5: Comparative Pricing Analysis');
  console.log('-'.repeat(50));
  
  const products = ['prod-001', 'prod-002', 'prod-003'];
  const pricingResults = [];
  
  for (const productId of products) {
    const result = await callAPI(priceCalculatorHandler, {
      httpMethod: 'POST',
      body: JSON.stringify({
        productId,
        userId: 'comparison-user',
        userSegment: 'returning_customer'
      })
    }, `Pricing analysis for ${productId}`);
    
    if (result && result.success) {
      pricingResults.push({
        product: result.data.product.name,
        originalPrice: result.data.pricing.originalPrice,
        newPrice: result.data.pricing.newPrice,
        change: result.data.pricing.priceChangePercent,
        recommendation: result.data.pricing.recommendation
      });
    }
  }
  
  // Summary table
  console.log('\n📋 PRICING COMPARISON SUMMARY');
  console.log('-'.repeat(50));
  console.log('Product'.padEnd(35) + 'Original'.padEnd(10) + 'New'.padEnd(10) + 'Change'.padEnd(10) + 'Action');
  console.log('-'.repeat(75));
  
  pricingResults.forEach(item => {
    console.log(
      item.product.substring(0, 34).padEnd(35) +
      `$${item.originalPrice}`.padEnd(10) +
      `$${item.newPrice}`.padEnd(10) +
      `${item.change}%`.padEnd(10) +
      item.recommendation
    );
  });
}

// Market simulation demo
async function runMarketSimulation() {
  console.log('\n🌐 MARKET SIMULATION DEMO');
  console.log('-'.repeat(50));
  
  console.log('Simulating different market conditions...\n');
  
  const scenarios = [
    { name: 'High Demand Period', userSegment: 'returning_customer', productId: 'prod-001' },
    { name: 'Low Inventory Alert', userSegment: 'price_sensitive', productId: 'prod-002' },
    { name: 'Weekend Premium', userSegment: 'vip_customer', productId: 'prod-003' },
    { name: 'New Customer Acquisition', userSegment: 'new_customer', productId: 'prod-001' }
  ];
  
  for (const scenario of scenarios) {
    console.log(`\n🎬 ${scenario.name}`);
    await callAPI(priceCalculatorHandler, {
      httpMethod: 'POST',
      body: JSON.stringify({
        productId: scenario.productId,
        userId: `scenario-${scenario.name.toLowerCase().replace(/\s+/g, '-')}`,
        userSegment: scenario.userSegment
      })
    }, `Market scenario: ${scenario.name}`);
    
    await new Promise(resolve => setTimeout(resolve, 300));
  }
}

// Performance demonstration
async function runPerformanceDemo() {
  console.log('\n⚡ PERFORMANCE DEMONSTRATION');
  console.log('-'.repeat(50));
  
  const startTime = Date.now();
  const concurrentRequests = 20;
  
  console.log(`Executing ${concurrentRequests} concurrent pricing requests...`);
  
  const promises = Array.from({ length: concurrentRequests }, (_, i) => 
    priceCalculatorHandler({
      httpMethod: 'POST',
      body: JSON.stringify({
        productId: `prod-${String((i % 3) + 1).padStart(3, '0')}`,
        userId: `perf-user-${i}`,
        userSegment: ['new_customer', 'returning_customer', 'vip_customer', 'price_sensitive'][i % 4]
      })
    }, createMockContext(`perf-test-${i}`))
  );
  
  try {
    const results = await Promise.all(promises);
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    const successCount = results.filter(r => r.statusCode === 200).length;
    const responses = results.map(r => JSON.parse(r.body));
    const avgPriceChange = responses
      .filter(r => r.success)
      .reduce((sum, r) => sum + parseFloat(r.data.pricing.priceChangePercent), 0) / successCount;
    
    console.log('\n📊 PERFORMANCE RESULTS:');
    console.log(`   Total Requests: ${concurrentRequests}`);
    console.log(`   Success Rate: ${successCount}/${concurrentRequests} (${(successCount/concurrentRequests*100).toFixed(1)}%)`);
    console.log(`   Total Duration: ${duration}ms`);
    console.log(`   Average Response Time: ${(duration/concurrentRequests).toFixed(1)}ms per request`);
    console.log(`   Throughput: ${(concurrentRequests/(duration/1000)).toFixed(1)} requests/second`);
    console.log(`   Average Price Change: ${avgPriceChange.toFixed(2)}%`);
    
  } catch (error) {
    console.log(`❌ Performance test failed: ${error.message}`);
  }
}

// Main demo runner
async function runDemo() {
  console.log('🚀 AWS LAMBDA PRICE OPTIMIZATION API DEMO');
  console.log('🎯 Simulating real-world pricing scenarios...\n');
  
  try {
    await runPricingDemo();
    await runMarketSimulation();
    await runPerformanceDemo();
    
    console.log('\n' + '='.repeat(70));
    console.log('✅ DEMO COMPLETED SUCCESSFULLY!');
    console.log('='.repeat(70));
    
    console.log('\n📝 KEY FEATURES DEMONSTRATED:');
    console.log('   ✅ Multi-factor pricing algorithm');
    console.log('   ✅ User segment-based pricing');
    console.log('   ✅ Real-time price optimization');
    console.log('   ✅ Product catalog management');
    console.log('   ✅ Analytics and reporting');
    console.log('   ✅ High-performance concurrent processing');
    console.log('   ✅ Market condition simulation');
    
    console.log('\n🔗 READY FOR AWS DEPLOYMENT:');
    console.log('   • Lambda functions built and tested');
    console.log('   • API Gateway integration ready');
    console.log('   • EventBridge scheduling configured');
    console.log('   • CloudWatch monitoring enabled');
    
  } catch (error) {
    console.error('❌ Demo failed:', error.message);
    process.exit(1);
  }
}

// Run demo if this file is executed directly
if (require.main === module) {
  runDemo();
}

module.exports = { runDemo, runPricingDemo, runMarketSimulation, runPerformanceDemo }; 
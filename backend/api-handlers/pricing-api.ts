import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
// import { MultiFactorPricingEngine } from '../pricing-engine/multi-factor-pricing';

// Mock DynamoDB for now - will be replaced with actual AWS SDK
const mockDynamoDB = {
  get: async (params: any) => ({ Item: mockData[params.Key.productId] || mockData[params.Key.userId] }),
  query: async (params: any) => ({ Items: mockPriceHistory }),
  put: async (params: any) => ({})
};

// Mock data for development
const mockData: any = {
  'prod-001': {
    productId: 'prod-001',
    name: 'Premium Flight Ticket',
    price: 299.99,
    inventory: 50,
    maxInventory: 100,
    priceFloor: 199.99,
    priceCeiling: 499.99
  },
  'prod-002': {
    productId: 'prod-002',
    name: 'Hotel Room',
    price: 150.00,
    inventory: 25,
    maxInventory: 50,
    priceFloor: 100.00,
    priceCeiling: 300.00
  },
  'user-001': {
    userId: 'user-001',
    segment: 'returning_customer'
  }
};

const mockPriceHistory = [
  { productId: 'prod-001', price: 299.99, timestamp: '2024-01-01T10:00:00Z' },
  { productId: 'prod-001', price: 310.00, timestamp: '2024-01-02T10:00:00Z' },
  { productId: 'prod-001', price: 295.00, timestamp: '2024-01-03T10:00:00Z' }
];

// const pricingEngine = new MultiFactorPricingEngine();

export const calculatePrice = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const body = JSON.parse(event.body || '{}');
    const { productId, userId, currentPrice } = body;

    if (!productId) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ error: 'productId is required' })
      };
    }

    // Fetch product data from DynamoDB
    const productData = await getProductData(productId);

    if (!productData) {
      return {
        statusCode: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ error: 'Product not found' })
      };
    }

    // Simple mock price calculation
    const basePrice = currentPrice || productData.price;
    const adjustment = (Math.random() - 0.5) * 0.1; // ±5% random adjustment
    const newPrice = Math.max(
      basePrice * (1 + adjustment),
      basePrice * 0.8 // Minimum 20% discount
    );

    const result = {
      productId,
      optimizedPrice: Math.round(newPrice * 100) / 100,
      confidence: 0.7 + Math.random() * 0.2, // 70-90% confidence
      factors: {
        demandAdjustment: adjustment * 0.5,
        inventoryAdjustment: 0,
        timeAdjustment: 0,
        competitorAdjustment: 0,
        userSegmentAdjustment: 0,
        historicalAdjustment: 0,
        externalAdjustment: 0
      },
      timestamp: new Date().toISOString()
    };

    // Store pricing decision
    await storePricingDecision(result);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify(result)
    };
  } catch (error) {
    console.error('Error calculating price:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};

export const getPriceHistory = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const { productId } = event.pathParameters || {};
    
    if (!productId) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ error: 'productId is required' })
      };
    }

    const params = {
      TableName: 'PricingHistory',
      KeyConditionExpression: 'productId = :productId',
      ExpressionAttributeValues: {
        ':productId': productId
      },
      ScanIndexForward: false,
      Limit: 100
    };

    const result = await mockDynamoDB.query(params);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify(result.Items)
    };
  } catch (error) {
    console.error('Error fetching price history:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};

export const getProducts = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    // Mock products data
    const products = [
      {
        productId: 'prod-001',
        name: 'Premium Flight Ticket',
        price: 299.99,
        inventory: 50,
        maxInventory: 100,
        category: 'travel'
      },
      {
        productId: 'prod-002',
        name: 'Hotel Room',
        price: 150.00,
        inventory: 25,
        maxInventory: 50,
        category: 'accommodation'
      },
      {
        productId: 'prod-003',
        name: 'Car Rental',
        price: 75.00,
        inventory: 30,
        maxInventory: 60,
        category: 'transportation'
      }
    ];

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify(products)
    };
  } catch (error) {
    console.error('Error fetching products:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};

export const recordPurchase = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const { productId } = event.pathParameters || {};
    const body = JSON.parse(event.body || '{}');
    const { userId, quantity = 1 } = body;

    if (!productId || !userId) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ error: 'productId and userId are required' })
      };
    }

    // Record purchase event for demand analysis
    await recordPurchaseEvent(productId, userId, quantity);

    // Trigger price recalculation
    await triggerPriceRecalculation(productId);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ 
        message: 'Purchase recorded successfully',
        productId,
        userId,
        quantity
      })
    };
  } catch (error) {
    console.error('Error recording purchase:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};

// Helper functions
async function getProductData(productId: string) {
  const result = await mockDynamoDB.get({
    TableName: 'Products',
    Key: { productId }
  });
  return result.Item;
}

async function getUserData(userId: string) {
  const result = await mockDynamoDB.get({
    TableName: 'Users',
    Key: { userId }
  });
  return result.Item || { segment: 'returning_customer' };
}

async function getMarketData(productId: string) {
  // This would integrate with external APIs for competitor pricing
  return { competitorPrice: null };
}

async function calculateDemandElasticity(productId: string): Promise<number> {
  // Calculate based on recent purchase patterns
  const recentPurchases = await getRecentPurchases(productId);
  const recentViews = await getRecentViews(productId);
  
  if (recentViews === 0) return 0.5;
  return recentPurchases / recentViews;
}

function calculateTimeFactor(): number {
  const now = new Date();
  const hour = now.getHours();
  const dayOfWeek = now.getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  
  let factor = 1;
  
  // Peak hours (10-18) get higher factor
  if (hour >= 10 && hour <= 18) factor += 0.2;
  
  // Weekends get higher factor
  if (isWeekend) factor += 0.3;
  
  return factor;
}

function calculateSeasonality(): number {
  const month = new Date().getMonth();
  // Simple seasonality model - can be enhanced with ML
  const seasonalFactors = [0.8, 0.9, 1.0, 1.1, 1.2, 1.3, 1.2, 1.1, 1.0, 0.9, 0.8, 0.7];
  return seasonalFactors[month];
}

async function getHistoricalPerformance(productId: string): Promise<number> {
  // Calculate based on historical price-demand relationship
  return 0.7; // Placeholder
}

async function getWeatherData(): Promise<number> {
  // Integrate with weather API
  return 0; // Placeholder
}

async function getEconomicData(): Promise<number> {
  // Integrate with economic indicators API
  return 0; // Placeholder
}

async function storePricingDecision(decision: any) {
  await mockDynamoDB.put({
    TableName: 'PricingHistory',
    Item: decision
  });
}

async function getRecentPurchases(productId: string): Promise<number> {
  // Query recent purchases from DynamoDB
  return 10; // Placeholder
}

async function getRecentViews(productId: string): Promise<number> {
  // Query recent views from DynamoDB
  return 100; // Placeholder
}

async function recordPurchaseEvent(productId: string, userId: string, quantity: number) {
  // Record purchase event in DynamoDB
  console.log(`Recording purchase: ${productId}, ${userId}, ${quantity}`);
}

async function triggerPriceRecalculation(productId: string) {
  // Trigger EventBridge event for price recalculation
  console.log(`Triggering price recalculation for: ${productId}`);
}

// Main Lambda handler
export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const { httpMethod, path } = event;
    
    // Route based on HTTP method and path
    if (httpMethod === 'GET' && path === '/products') {
      return await getProducts(event);
    }
    
    if (httpMethod === 'POST' && path === '/pricing/calculate') {
      return await calculatePrice(event);
    }
    
    if (httpMethod === 'GET' && path.includes('/pricing/history/')) {
      return await getPriceHistory(event);
    }
    
    if (httpMethod === 'POST' && path.includes('/products/') && path.includes('/purchase')) {
      return await recordPurchase(event);
    }
    
    // Default response for unmatched routes
    return {
      statusCode: 404,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ error: 'Not Found' })
    };
  } catch (error) {
    console.error('Handler error:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
}; 
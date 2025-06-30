import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';

// Mock data for demonstration - in production this would come from DynamoDB
const mockProducts = {
  'prod-001': {
    productId: 'prod-001',
    name: 'Premium Flight Ticket - NYC to LAX',
    basePrice: 299.99,
    currentPrice: 299.99,
    inventory: 50,
    maxInventory: 100,
    priceFloor: 199.99,
    priceCeiling: 499.99,
    category: 'travel',
    demandLevel: 'medium'
  },
  'prod-002': {
    productId: 'prod-002',
    name: 'Luxury Hotel Room - Manhattan',
    basePrice: 250.00,
    currentPrice: 250.00,
    inventory: 25,
    maxInventory: 50,
    priceFloor: 150.00,
    priceCeiling: 400.00,
    category: 'accommodation',
    demandLevel: 'high'
  },
  'prod-003': {
    productId: 'prod-003',
    name: 'Premium Car Rental - Tesla Model S',
    basePrice: 120.00,
    currentPrice: 120.00,
    inventory: 15,
    maxInventory: 30,
    priceFloor: 80.00,
    priceCeiling: 200.00,
    category: 'transportation',
    demandLevel: 'low'
  }
};

const mockUserSegments = {
  'new_customer': { discount: 0.05, label: 'New Customer' },
  'returning_customer': { discount: 0.02, label: 'Returning Customer' },
  'vip_customer': { discount: 0.10, label: 'VIP Customer' },
  'price_sensitive': { discount: 0.03, label: 'Price Sensitive' },
  'premium': { discount: -0.05, label: 'Premium Segment' }
};

interface PricingFactors {
  productId: string;
  userSegment: string;
  timeOfDay: number;
  dayOfWeek: number;
  seasonality: number;
  demandLevel: string;
  inventoryRatio: number;
  weatherFactor?: number;
  competitorPrice?: number;
}

export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  console.log('Event:', JSON.stringify(event, null, 2));
  
  try {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type,Authorization',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
      'Content-Type': 'application/json'
    };

    // Handle preflight requests
    if (event.httpMethod === 'OPTIONS') {
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: ''
      };
    }

    const body = event.body ? JSON.parse(event.body) : {};
    const { productId, userId = 'user-001', userSegment = 'returning_customer' } = body;

    if (!productId) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ 
          error: 'productId is required',
          example: {
            productId: 'prod-001',
            userId: 'user-001',
            userSegment: 'returning_customer'
          }
        })
      };
    }

    const product = mockProducts[productId as keyof typeof mockProducts];
    if (!product) {
      return {
        statusCode: 404,
        headers: corsHeaders,
        body: JSON.stringify({ 
          error: 'Product not found',
          availableProducts: Object.keys(mockProducts)
        })
      };
    }

    // Calculate pricing factors
    const now = new Date();
    const pricingFactors: PricingFactors = {
      productId,
      userSegment,
      timeOfDay: now.getHours(),
      dayOfWeek: now.getDay(),
      seasonality: calculateSeasonality(now),
      demandLevel: product.demandLevel,
      inventoryRatio: product.inventory / product.maxInventory,
      weatherFactor: Math.random() * 0.2 - 0.1, // Random weather impact
      competitorPrice: product.currentPrice * (0.9 + Math.random() * 0.2) // Simulated competitor price
    };

    // Calculate optimal price
    const pricingResult = calculateOptimalPrice(product, pricingFactors);

    // Simulate API response delay for realism
    await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        success: true,
        timestamp: new Date().toISOString(),
        requestId: context.awsRequestId,
        data: {
          product: {
            id: product.productId,
            name: product.name,
            category: product.category,
            basePrice: product.basePrice,
            currentPrice: product.currentPrice
          },
          pricing: pricingResult,
          factors: pricingFactors,
          userInfo: {
            userId,
            segment: userSegment,
            segmentInfo: mockUserSegments[userSegment as keyof typeof mockUserSegments]
          }
        }
      })
    };

  } catch (error) {
    console.error('Error in price calculator:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
        requestId: context.awsRequestId
      })
    };
  }
};

function calculateSeasonality(date: Date): number {
  const month = date.getMonth();
  // Higher values for peak travel months
  const seasonalityMap = [0.8, 0.7, 0.9, 1.0, 1.2, 1.3, 1.4, 1.3, 1.1, 1.0, 0.9, 1.1];
  return seasonalityMap[month];
}

function calculateOptimalPrice(product: any, factors: PricingFactors) {
  let priceMultiplier = 1.0;
  const adjustments: any = {};

  // Time-based adjustments
  if (factors.timeOfDay >= 6 && factors.timeOfDay <= 10) {
    priceMultiplier *= 1.15; // Morning rush
    adjustments.timeOfDay = 0.15;
  } else if (factors.timeOfDay >= 17 && factors.timeOfDay <= 20) {
    priceMultiplier *= 1.20; // Evening rush
    adjustments.timeOfDay = 0.20;
  } else {
    adjustments.timeOfDay = 0;
  }

  // Weekend adjustments
  if (factors.dayOfWeek === 0 || factors.dayOfWeek === 6) {
    priceMultiplier *= 1.10;
    adjustments.weekend = 0.10;
  } else {
    adjustments.weekend = 0;
  }

  // Inventory-based adjustments
  if (factors.inventoryRatio < 0.2) {
    priceMultiplier *= 1.25; // Low inventory
    adjustments.inventory = 0.25;
  } else if (factors.inventoryRatio > 0.8) {
    priceMultiplier *= 0.95; // High inventory
    adjustments.inventory = -0.05;
  } else {
    adjustments.inventory = 0;
  }

  // Demand-based adjustments
  switch (factors.demandLevel) {
    case 'high':
      priceMultiplier *= 1.20;
      adjustments.demand = 0.20;
      break;
    case 'low':
      priceMultiplier *= 0.90;
      adjustments.demand = -0.10;
      break;
    default:
      adjustments.demand = 0;
  }

  // Seasonality adjustments
  priceMultiplier *= factors.seasonality;
  adjustments.seasonality = factors.seasonality - 1;

  // User segment adjustments
  const segmentInfo = mockUserSegments[factors.userSegment as keyof typeof mockUserSegments];
  if (segmentInfo) {
    priceMultiplier *= (1 + segmentInfo.discount);
    adjustments.userSegment = segmentInfo.discount;
  }

  // Weather adjustments (for travel products)
  if (product.category === 'travel' && factors.weatherFactor) {
    priceMultiplier *= (1 + factors.weatherFactor);
    adjustments.weather = factors.weatherFactor;
  }

  // Competitor price adjustments
  if (factors.competitorPrice) {
    const competitorDiff = (factors.competitorPrice - product.currentPrice) / product.currentPrice;
    if (Math.abs(competitorDiff) > 0.05) {
      const competitorAdjustment = competitorDiff * 0.3; // 30% of competitor difference
      priceMultiplier *= (1 + competitorAdjustment);
      adjustments.competitor = competitorAdjustment;
    }
  }

  // Calculate final price
  let newPrice = product.basePrice * priceMultiplier;
  
  // Apply price floor and ceiling constraints
  newPrice = Math.max(product.priceFloor, Math.min(product.priceCeiling, newPrice));
  
  // Round to 2 decimal places
  newPrice = Math.round(newPrice * 100) / 100;

  // Calculate confidence score
  const confidence = calculateConfidence(adjustments, factors.inventoryRatio);

  return {
    originalPrice: product.currentPrice,
    newPrice,
    priceChange: newPrice - product.currentPrice,
    priceChangePercent: ((newPrice - product.currentPrice) / product.currentPrice * 100).toFixed(2),
    confidence,
    adjustments,
    constraints: {
      floor: product.priceFloor,
      ceiling: product.priceCeiling,
      applied: newPrice === product.priceFloor ? 'floor' : 
               newPrice === product.priceCeiling ? 'ceiling' : 'none'
    },
    recommendation: newPrice > product.currentPrice ? 'increase' : 
                   newPrice < product.currentPrice ? 'decrease' : 'maintain'
  };
}

function calculateConfidence(adjustments: any, inventoryRatio: number): number {
  let confidence = 0.85; // Base confidence

  // Reduce confidence for extreme adjustments
  const totalAdjustment = Math.abs(Object.values(adjustments).reduce((sum: number, adj: any) => sum + Math.abs(adj), 0));
  if (totalAdjustment > 0.5) confidence -= 0.15;
  if (totalAdjustment > 0.3) confidence -= 0.10;

  // Reduce confidence for very low inventory (less predictable)
  if (inventoryRatio < 0.1) confidence -= 0.10;

  // Ensure confidence is between 0.5 and 0.95
  return Math.max(0.5, Math.min(0.95, confidence));
} 
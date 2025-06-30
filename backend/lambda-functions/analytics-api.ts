import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';

// Mock analytics data for demonstration
const generateMockAnalytics = () => {
  const now = new Date();
  const last30Days = Array.from({ length: 30 }, (_, i) => {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    return date;
  }).reverse();

  return {
    priceOptimizationMetrics: {
      totalOptimizations: 1247,
      successfulOptimizations: 1089,
      averagePriceIncrease: 8.3,
      revenueImpact: 45678.90,
      optimizationAccuracy: 87.3,
      lastUpdated: now.toISOString()
    },
    dailyMetrics: last30Days.map(date => ({
      date: date.toISOString().split('T')[0],
      priceOptimizations: Math.floor(Math.random() * 50) + 20,
      revenueGenerated: Math.floor(Math.random() * 5000) + 1000,
      averagePrice: Math.floor(Math.random() * 100) + 150,
      conversionRate: Math.random() * 0.1 + 0.05,
      customerSatisfaction: Math.random() * 0.3 + 0.7
    })),
    productPerformance: [
      {
        productId: 'prod-001',
        name: 'Premium Flight Ticket - NYC to LAX',
        category: 'travel',
        totalRevenue: 15234.50,
        optimizations: 89,
        averagePriceIncrease: 12.5,
        conversionRate: 0.078,
        demandElasticity: 0.65
      },
      {
        productId: 'prod-002',
        name: 'Luxury Hotel Room - Manhattan',
        category: 'accommodation',
        totalRevenue: 18750.00,
        optimizations: 125,
        averagePriceIncrease: 6.8,
        conversionRate: 0.092,
        demandElasticity: 0.45
      },
      {
        productId: 'prod-003',
        name: 'Premium Car Rental - Tesla Model S',
        category: 'transportation',
        totalRevenue: 8640.00,
        optimizations: 72,
        averagePriceIncrease: 4.2,
        conversionRate: 0.056,
        demandElasticity: 0.78
      }
    ],
    segmentAnalysis: {
      userSegments: [
        {
          segment: 'new_customer',
          count: 1247,
          averageOrderValue: 245.67,
          conversionRate: 0.045,
          priceElasticity: 0.82,
          revenueContribution: 23.4
        },
        {
          segment: 'returning_customer',
          count: 2891,
          averageOrderValue: 298.45,
          conversionRate: 0.067,
          priceElasticity: 0.56,
          revenueContribution: 45.8
        },
        {
          segment: 'vip_customer',
          count: 456,
          averageOrderValue: 567.89,
          conversionRate: 0.123,
          priceElasticity: 0.23,
          revenueContribution: 30.8
        }
      ]
    },
    marketTrends: {
      competitorAnalysis: [
        {
          competitor: 'Competitor A',
          averagePrice: 289.99,
          marketShare: 0.25,
          priceStrategy: 'aggressive'
        },
        {
          competitor: 'Competitor B',
          averagePrice: 334.50,
          marketShare: 0.18,
          priceStrategy: 'premium'
        },
        {
          competitor: 'Competitor C',
          averagePrice: 267.80,
          marketShare: 0.15,
          priceStrategy: 'value'
        }
      ],
      seasonalTrends: [
        { month: 'Jan', demandMultiplier: 0.8, priceOptimal: 0.95 },
        { month: 'Feb', demandMultiplier: 0.7, priceOptimal: 0.90 },
        { month: 'Mar', demandMultiplier: 0.9, priceOptimal: 1.05 },
        { month: 'Apr', demandMultiplier: 1.0, priceOptimal: 1.10 },
        { month: 'May', demandMultiplier: 1.2, priceOptimal: 1.25 },
        { month: 'Jun', demandMultiplier: 1.3, priceOptimal: 1.35 },
        { month: 'Jul', demandMultiplier: 1.4, priceOptimal: 1.40 },
        { month: 'Aug', demandMultiplier: 1.3, priceOptimal: 1.30 },
        { month: 'Sep', demandMultiplier: 1.1, priceOptimal: 1.15 },
        { month: 'Oct', demandMultiplier: 1.0, priceOptimal: 1.05 },
        { month: 'Nov', demandMultiplier: 0.9, priceOptimal: 0.95 },
        { month: 'Dec', demandMultiplier: 1.1, priceOptimal: 1.20 }
      ]
    }
  };
};

export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  console.log('Analytics API Event:', JSON.stringify(event, null, 2));
  
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

    const pathParams = event.pathParameters || {};
    const queryParams = event.queryStringParameters || {};
    
    // Generate fresh analytics data
    const analyticsData = generateMockAnalytics();
    
    // Handle different analytics endpoints
    switch (pathParams.type) {
      case 'overview':
        return await getOverviewAnalytics(analyticsData, queryParams, corsHeaders, context);
      
      case 'products':
        return await getProductAnalytics(analyticsData, queryParams, corsHeaders, context);
      
      case 'segments':
        return await getSegmentAnalytics(analyticsData, queryParams, corsHeaders, context);
      
      case 'trends':
        return await getTrendAnalytics(analyticsData, queryParams, corsHeaders, context);
      
      case 'realtime':
        return await getRealtimeAnalytics(corsHeaders, context);
      
      default:
        // Return all analytics data
        return {
          statusCode: 200,
          headers: corsHeaders,
          body: JSON.stringify({
            success: true,
            timestamp: new Date().toISOString(),
            requestId: context.awsRequestId,
            data: analyticsData
          })
        };
    }

  } catch (error) {
    console.error('Error in analytics API:', error);
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

async function getOverviewAnalytics(data: any, queryParams: any, corsHeaders: any, context: Context): Promise<APIGatewayProxyResult> {
  const days = parseInt(queryParams.days || '30');
  const filteredDailyMetrics = data.dailyMetrics.slice(-days);
  
  const overview = {
    summary: data.priceOptimizationMetrics,
    dailyTrends: filteredDailyMetrics,
    topProducts: data.productPerformance.slice(0, 3),
    kpis: {
      totalRevenue: filteredDailyMetrics.reduce((sum: number, day: any) => sum + day.revenueGenerated, 0),
      averageOptimizations: Math.round(filteredDailyMetrics.reduce((sum: number, day: any) => sum + day.priceOptimizations, 0) / filteredDailyMetrics.length),
      overallConversionRate: filteredDailyMetrics.reduce((sum: number, day: any) => sum + day.conversionRate, 0) / filteredDailyMetrics.length,
      customerSatisfactionScore: filteredDailyMetrics.reduce((sum: number, day: any) => sum + day.customerSatisfaction, 0) / filteredDailyMetrics.length
    }
  };

  return {
    statusCode: 200,
    headers: corsHeaders,
    body: JSON.stringify({
      success: true,
      timestamp: new Date().toISOString(),
      requestId: context.awsRequestId,
      data: overview
    })
  };
}

async function getProductAnalytics(data: any, queryParams: any, corsHeaders: any, context: Context): Promise<APIGatewayProxyResult> {
  let productAnalytics = data.productPerformance;
  
  if (queryParams.category) {
    productAnalytics = productAnalytics.filter((p: any) => 
      p.category.toLowerCase() === queryParams.category.toLowerCase()
    );
  }

  return {
    statusCode: 200,
    headers: corsHeaders,
    body: JSON.stringify({
      success: true,
      timestamp: new Date().toISOString(),
      requestId: context.awsRequestId,
      data: {
        products: productAnalytics,
        aggregates: {
          totalRevenue: productAnalytics.reduce((sum: number, p: any) => sum + p.totalRevenue, 0),
          totalOptimizations: productAnalytics.reduce((sum: number, p: any) => sum + p.optimizations, 0),
          averageConversionRate: productAnalytics.reduce((sum: number, p: any) => sum + p.conversionRate, 0) / productAnalytics.length
        }
      }
    })
  };
}

async function getSegmentAnalytics(data: any, queryParams: any, corsHeaders: any, context: Context): Promise<APIGatewayProxyResult> {
  return {
    statusCode: 200,
    headers: corsHeaders,
    body: JSON.stringify({
      success: true,
      timestamp: new Date().toISOString(),
      requestId: context.awsRequestId,
      data: data.segmentAnalysis
    })
  };
}

async function getTrendAnalytics(data: any, queryParams: any, corsHeaders: any, context: Context): Promise<APIGatewayProxyResult> {
  return {
    statusCode: 200,
    headers: corsHeaders,
    body: JSON.stringify({
      success: true,
      timestamp: new Date().toISOString(),
      requestId: context.awsRequestId,
      data: data.marketTrends
    })
  };
}

async function getRealtimeAnalytics(corsHeaders: any, context: Context): Promise<APIGatewayProxyResult> {
  // Generate real-time metrics
  const realtimeData = {
    currentTimestamp: new Date().toISOString(),
    activeOptimizations: Math.floor(Math.random() * 15) + 5,
    recentPriceChanges: Array.from({ length: 10 }, (_, i) => ({
      productId: `prod-${String(Math.floor(Math.random() * 3) + 1).padStart(3, '0')}`,
      oldPrice: Math.floor(Math.random() * 200) + 100,
      newPrice: Math.floor(Math.random() * 200) + 100,
      change: (Math.random() * 20 - 10).toFixed(2),
      timestamp: new Date(Date.now() - i * 60000).toISOString(),
      reason: ['inventory_low', 'high_demand', 'competitor_change', 'time_based'][Math.floor(Math.random() * 4)]
    })),
    liveMetrics: {
      requestsPerMinute: Math.floor(Math.random() * 100) + 50,
      averageResponseTime: Math.floor(Math.random() * 200) + 100,
      successRate: 0.95 + Math.random() * 0.04,
      activeUsers: Math.floor(Math.random() * 500) + 200
    },
    alerts: [
      {
        type: 'info',
        message: 'High demand detected for travel products',
        timestamp: new Date(Date.now() - 300000).toISOString()
      },
      {
        type: 'warning',
        message: 'Low inventory alert for prod-002',
        timestamp: new Date(Date.now() - 600000).toISOString()
      }
    ]
  };

  return {
    statusCode: 200,
    headers: corsHeaders,
    body: JSON.stringify({
      success: true,
      timestamp: new Date().toISOString(),
      requestId: context.awsRequestId,
      data: realtimeData
    })
  };
} 
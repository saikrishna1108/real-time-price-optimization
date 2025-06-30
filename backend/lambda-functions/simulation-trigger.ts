import { ScheduledEvent, Context } from 'aws-lambda';

// Mock products for simulation
const mockProducts = [
  { id: 'prod-001', name: 'Premium Flight Ticket - NYC to LAX', basePrice: 299.99 },
  { id: 'prod-002', name: 'Luxury Hotel Room - Manhattan', basePrice: 250.00 },
  { id: 'prod-003', name: 'Premium Car Rental - Tesla Model S', basePrice: 120.00 },
  { id: 'prod-004', name: 'Concert Tickets - Madison Square Garden', basePrice: 150.00 }
];

interface SimulationResult {
  productId: string;
  oldPrice: number;
  newPrice: number;
  change: number;
  changePercent: string;
  reason: string;
  timestamp: string;
  confidence: number;
}

export const handler = async (
  event: ScheduledEvent,
  context: Context
): Promise<void> => {
  console.log('Simulation Trigger Event:', JSON.stringify(event, null, 2));
  
  try {
    console.log('Starting price optimization simulation...');
    
    const simulationResults: SimulationResult[] = [];
    
    // Simulate price optimization for each product
    for (const product of mockProducts) {
      const result = await simulatePriceOptimization(product);
      simulationResults.push(result);
      
      // Log the simulation result
      console.log(`Price optimization for ${product.name}:`, result);
    }
    
    // Simulate some market events
    await simulateMarketEvents();
    
    // Generate summary report
    const summary = generateSimulationSummary(simulationResults);
    console.log('Simulation Summary:', summary);
    
    // In a real scenario, you would:
    // 1. Store results in DynamoDB
    // 2. Send notifications via SNS
    // 3. Update CloudWatch metrics
    // 4. Trigger other Lambda functions
    
    console.log('Price optimization simulation completed successfully');
    
  } catch (error) {
    console.error('Error in simulation trigger:', error);
    throw error;
  }
};

async function simulatePriceOptimization(product: any): Promise<SimulationResult> {
  // Simulate various pricing factors
  const factors = {
    timeOfDay: new Date().getHours(),
    dayOfWeek: new Date().getDay(),
    inventory: Math.random(),
    demand: Math.random(),
    competition: Math.random(),
    weather: Math.random() * 0.2 - 0.1,
    seasonality: 0.8 + Math.random() * 0.4
  };
  
  // Calculate price adjustment based on factors
  let priceMultiplier = 1.0;
  let reasons: string[] = [];
  
  // Time-based adjustments
  if (factors.timeOfDay >= 6 && factors.timeOfDay <= 10) {
    priceMultiplier *= 1.15;
    reasons.push('morning_rush');
  } else if (factors.timeOfDay >= 17 && factors.timeOfDay <= 20) {
    priceMultiplier *= 1.20;
    reasons.push('evening_rush');
  }
  
  // Weekend adjustments
  if (factors.dayOfWeek === 0 || factors.dayOfWeek === 6) {
    priceMultiplier *= 1.10;
    reasons.push('weekend_premium');
  }
  
  // Inventory adjustments
  if (factors.inventory < 0.2) {
    priceMultiplier *= 1.25;
    reasons.push('low_inventory');
  } else if (factors.inventory > 0.8) {
    priceMultiplier *= 0.95;
    reasons.push('high_inventory');
  }
  
  // Demand adjustments
  if (factors.demand > 0.8) {
    priceMultiplier *= 1.20;
    reasons.push('high_demand');
  } else if (factors.demand < 0.3) {
    priceMultiplier *= 0.90;
    reasons.push('low_demand');
  }
  
  // Competition adjustments
  if (factors.competition > 0.7) {
    priceMultiplier *= 0.95;
    reasons.push('competitive_pressure');
  }
  
  // Weather adjustments (for travel products)
  if (product.name.includes('Flight') && Math.abs(factors.weather) > 0.05) {
    priceMultiplier *= (1 + factors.weather);
    reasons.push(factors.weather > 0 ? 'bad_weather' : 'good_weather');
  }
  
  // Seasonality
  priceMultiplier *= factors.seasonality;
  if (factors.seasonality > 1.1) {
    reasons.push('peak_season');
  } else if (factors.seasonality < 0.9) {
    reasons.push('off_season');
  }
  
  const newPrice = Math.round(product.basePrice * priceMultiplier * 100) / 100;
  const change = newPrice - product.basePrice;
  const changePercent = ((change / product.basePrice) * 100).toFixed(2);
  
  // Calculate confidence based on number of factors
  const confidence = Math.max(0.6, Math.min(0.95, 0.8 - (reasons.length * 0.05)));
  
  return {
    productId: product.id,
    oldPrice: product.basePrice,
    newPrice,
    change,
    changePercent,
    reason: reasons.join(', ') || 'baseline',
    timestamp: new Date().toISOString(),
    confidence
  };
}

async function simulateMarketEvents(): Promise<void> {
  const events = [
    'competitor_price_drop',
    'inventory_shortage',
    'demand_spike',
    'weather_disruption',
    'economic_indicator_change',
    'seasonal_trend_shift'
  ];
  
  // Randomly trigger 1-3 market events
  const numEvents = Math.floor(Math.random() * 3) + 1;
  const triggeredEvents = [];
  
  for (let i = 0; i < numEvents; i++) {
    const event = events[Math.floor(Math.random() * events.length)];
    triggeredEvents.push(event);
    
    console.log(`Market event triggered: ${event}`);
    
    // Simulate event processing delay
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log(`Processed ${triggeredEvents.length} market events:`, triggeredEvents);
}

function generateSimulationSummary(results: SimulationResult[]) {
  const totalProducts = results.length;
  const priceIncreases = results.filter(r => r.change > 0).length;
  const priceDecreases = results.filter(r => r.change < 0).length;
  const noChange = results.filter(r => r.change === 0).length;
  
  const averageChange = results.reduce((sum, r) => sum + r.change, 0) / totalProducts;
  const averageChangePercent = results.reduce((sum, r) => sum + parseFloat(r.changePercent), 0) / totalProducts;
  const averageConfidence = results.reduce((sum, r) => sum + r.confidence, 0) / totalProducts;
  
  const maxIncrease = Math.max(...results.map(r => r.change));
  const maxDecrease = Math.min(...results.map(r => r.change));
  
  return {
    timestamp: new Date().toISOString(),
    totalProducts,
    priceChanges: {
      increases: priceIncreases,
      decreases: priceDecreases,
      noChange
    },
    averages: {
      priceChange: Math.round(averageChange * 100) / 100,
      changePercent: Math.round(averageChangePercent * 100) / 100,
      confidence: Math.round(averageConfidence * 100) / 100
    },
    extremes: {
      maxIncrease: Math.round(maxIncrease * 100) / 100,
      maxDecrease: Math.round(maxDecrease * 100) / 100
    },
    topReasons: getTopReasons(results)
  };
}

function getTopReasons(results: SimulationResult[]): { reason: string; count: number }[] {
  const reasonCounts: { [key: string]: number } = {};
  
  results.forEach(result => {
    const reasons = result.reason.split(', ');
    reasons.forEach(reason => {
      reasonCounts[reason] = (reasonCounts[reason] || 0) + 1;
    });
  });
  
  return Object.entries(reasonCounts)
    .map(([reason, count]) => ({ reason, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
} 
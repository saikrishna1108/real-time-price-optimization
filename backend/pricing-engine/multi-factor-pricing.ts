import { DynamoDB } from 'aws-sdk';
import { BedrockRuntime } from '@aws-sdk/client-bedrock-runtime';

const dynamodb = new DynamoDB.DocumentClient();
const bedrock = new BedrockRuntime({ region: process.env.AWS_REGION || 'us-east-1' });

interface PricingFactors {
  productId: string;
  currentPrice: number;
  demandElasticity: number;
  inventoryLevel: number;
  timeFactor: number;
  competitorPrice?: number;
  userSegment: string;
  historicalPerformance: number;
  externalFactors: {
    weather?: number;
    economicIndicator?: number;
    seasonality: number;
  };
}

interface PricingResult {
  productId: string;
  newPrice: number;
  confidence: number;
  factors: {
    demandAdjustment: number;
    inventoryAdjustment: number;
    timeAdjustment: number;
    competitorAdjustment: number;
    userSegmentAdjustment: number;
    historicalAdjustment: number;
    externalAdjustment: number;
  };
  timestamp: string;
}

interface AdjustmentFactors {
  demandAdjustment: number;
  inventoryAdjustment: number;
  timeAdjustment: number;
  competitorAdjustment: number;
  userSegmentAdjustment: number;
  historicalAdjustment: number;
  externalAdjustment: number;
}

interface UserSegmentAdjustments {
  [key: string]: number;
}

export class MultiFactorPricingEngine {
  
  async calculateOptimalPrice(factors: PricingFactors): Promise<PricingResult> {
    const {
      demandElasticity,
      inventoryLevel,
      timeFactor,
      competitorPrice,
      userSegment,
      historicalPerformance,
      externalFactors
    } = factors;

    // 1. Demand Elasticity Adjustment
    const demandAdjustment = this.calculateDemandAdjustment(demandElasticity);
    
    // 2. Inventory-based Adjustment
    const inventoryAdjustment = this.calculateInventoryAdjustment(inventoryLevel);
    
    // 3. Time-based Adjustment
    const timeAdjustment = this.calculateTimeAdjustment(timeFactor);
    
    // 4. Competitor Price Adjustment
    const competitorAdjustment = competitorPrice 
      ? this.calculateCompetitorAdjustment(factors.currentPrice, competitorPrice)
      : 0;
    
    // 5. User Segment Adjustment
    const userSegmentAdjustment = this.calculateUserSegmentAdjustment(userSegment);
    
    // 6. Historical Performance Adjustment
    const historicalAdjustment = this.calculateHistoricalAdjustment(historicalPerformance);
    
    // 7. External Factors Adjustment
    const externalAdjustment = this.calculateExternalAdjustment(externalFactors);

    // Combine all adjustments with weighted algorithm
    const totalAdjustment = this.combineAdjustments({
      demandAdjustment,
      inventoryAdjustment,
      timeAdjustment,
      competitorAdjustment,
      userSegmentAdjustment,
      historicalAdjustment,
      externalAdjustment
    });

    const newPrice = Math.max(
      factors.currentPrice * (1 + totalAdjustment),
      factors.currentPrice * 0.7 // Minimum 30% discount
    );

    // Use Bedrock for confidence scoring
    const confidence = await this.calculateConfidence(factors, totalAdjustment);

    return {
      productId: factors.productId,
      newPrice: Math.round(newPrice * 100) / 100, // Round to 2 decimal places
      confidence,
      factors: {
        demandAdjustment,
        inventoryAdjustment,
        timeAdjustment,
        competitorAdjustment,
        userSegmentAdjustment,
        historicalAdjustment,
        externalAdjustment
      },
      timestamp: new Date().toISOString()
    };
  }

  private calculateDemandAdjustment(elasticity: number): number {
    // Higher elasticity = more price sensitive
    // Lower elasticity = less price sensitive
    if (elasticity > 0.8) return -0.05; // High sensitivity, reduce price
    if (elasticity < 0.2) return 0.05;  // Low sensitivity, increase price
    return 0; // Neutral
  }

  private calculateInventoryAdjustment(inventoryLevel: number): number {
    // Low inventory = higher price
    // High inventory = lower price
    if (inventoryLevel < 0.1) return 0.1;  // Very low stock
    if (inventoryLevel < 0.3) return 0.05; // Low stock
    if (inventoryLevel > 0.8) return -0.05; // High stock
    return 0; // Normal stock
  }

  private calculateTimeAdjustment(timeFactor: number): number {
    // Peak hours, weekends, holidays = higher prices
    return timeFactor * 0.02; // 2% adjustment per time factor unit
  }

  private calculateCompetitorAdjustment(currentPrice: number, competitorPrice: number): number {
    const priceDifference = (competitorPrice - currentPrice) / currentPrice;
    if (priceDifference > 0.1) return 0.05;  // Competitor 10% higher
    if (priceDifference < -0.1) return -0.05; // Competitor 10% lower
    return 0; // Similar pricing
  }

  private calculateUserSegmentAdjustment(userSegment: string): number {
    const segmentAdjustments: UserSegmentAdjustments = {
      'new_customer': -0.03,    // Discount for new customers
      'returning_customer': 0,  // No adjustment
      'vip_customer': -0.05,    // VIP discount
      'price_sensitive': -0.02, // Small discount
      'premium': 0.02           // Premium pricing
    };
    return segmentAdjustments[userSegment] || 0;
  }

  private calculateHistoricalAdjustment(performance: number): number {
    // Based on historical price-demand relationship
    if (performance > 0.8) return 0.03;  // High performance, increase price
    if (performance < 0.3) return -0.03; // Low performance, decrease price
    return 0;
  }

  private calculateExternalAdjustment(factors: any): number {
    let adjustment = 0;
    
    // Weather impact (for travel/flight pricing)
    if (factors.weather) {
      adjustment += factors.weather * 0.01;
    }
    
    // Economic indicators
    if (factors.economicIndicator) {
      adjustment += factors.economicIndicator * 0.005;
    }
    
    // Seasonality
    adjustment += factors.seasonality * 0.02;
    
    return adjustment;
  }

  private combineAdjustments(adjustments: AdjustmentFactors): number {
    // Weighted combination of all adjustments
    const weights = {
      demandAdjustment: 0.25,
      inventoryAdjustment: 0.20,
      timeAdjustment: 0.15,
      competitorAdjustment: 0.15,
      userSegmentAdjustment: 0.10,
      historicalAdjustment: 0.10,
      externalAdjustment: 0.05
    };

    return (
      adjustments.demandAdjustment * weights.demandAdjustment +
      adjustments.inventoryAdjustment * weights.inventoryAdjustment +
      adjustments.timeAdjustment * weights.timeAdjustment +
      adjustments.competitorAdjustment * weights.competitorAdjustment +
      adjustments.userSegmentAdjustment * weights.userSegmentAdjustment +
      adjustments.historicalAdjustment * weights.historicalAdjustment +
      adjustments.externalAdjustment * weights.externalAdjustment
    );
  }

  private async calculateConfidence(factors: PricingFactors, adjustment: number): Promise<number> {
    // Use Bedrock to analyze confidence based on data quality and market conditions
    const prompt = `
      Analyze the confidence level for a price adjustment of ${(adjustment * 100).toFixed(2)}% 
      based on the following factors:
      - Demand elasticity: ${factors.demandElasticity}
      - Inventory level: ${factors.inventoryLevel}
      - Historical performance: ${factors.historicalPerformance}
      - Market conditions: ${JSON.stringify(factors.externalFactors)}
      
      Return a confidence score between 0 and 1.
    `;

    try {
      const response = await bedrock.invokeModel({
        modelId: 'anthropic.claude-3-sonnet-20240229-v1:0',
        contentType: 'application/json',
        body: JSON.stringify({
          prompt: prompt,
          max_tokens: 100,
          temperature: 0.1
        })
      });

      const result = JSON.parse(new TextDecoder().decode(response.body));
      return Math.min(Math.max(parseFloat(result.completion), 0), 1);
    } catch (error) {
      console.error('Bedrock confidence calculation failed:', error);
      return 0.7; // Default confidence
    }
  }
}

// Lambda handler
export const handler = async (event: any): Promise<any> => {
  try {
    const pricingEngine = new MultiFactorPricingEngine();
    const result = await pricingEngine.calculateOptimalPrice(event.factors);
    
    return {
      statusCode: 200,
      body: JSON.stringify(result)
    };
  } catch (error) {
    console.error('Error in pricing engine:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
}; 
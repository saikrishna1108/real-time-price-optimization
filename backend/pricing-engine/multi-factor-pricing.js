"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = exports.MultiFactorPricingEngine = void 0;
const aws_sdk_1 = require("aws-sdk");
const client_bedrock_runtime_1 = require("@aws-sdk/client-bedrock-runtime");
const dynamodb = new aws_sdk_1.DynamoDB.DocumentClient();
const bedrock = new client_bedrock_runtime_1.BedrockRuntime({ region: process.env.AWS_REGION || 'us-east-1' });
class MultiFactorPricingEngine {
    async calculateOptimalPrice(factors) {
        const { demandElasticity, inventoryLevel, timeFactor, competitorPrice, userSegment, historicalPerformance, externalFactors } = factors;
        const demandAdjustment = this.calculateDemandAdjustment(demandElasticity);
        const inventoryAdjustment = this.calculateInventoryAdjustment(inventoryLevel);
        const timeAdjustment = this.calculateTimeAdjustment(timeFactor);
        const competitorAdjustment = competitorPrice
            ? this.calculateCompetitorAdjustment(factors.currentPrice, competitorPrice)
            : 0;
        const userSegmentAdjustment = this.calculateUserSegmentAdjustment(userSegment);
        const historicalAdjustment = this.calculateHistoricalAdjustment(historicalPerformance);
        const externalAdjustment = this.calculateExternalAdjustment(externalFactors);
        const totalAdjustment = this.combineAdjustments({
            demandAdjustment,
            inventoryAdjustment,
            timeAdjustment,
            competitorAdjustment,
            userSegmentAdjustment,
            historicalAdjustment,
            externalAdjustment
        });
        const newPrice = Math.max(factors.currentPrice * (1 + totalAdjustment), factors.currentPrice * 0.7);
        const confidence = await this.calculateConfidence(factors, totalAdjustment);
        return {
            productId: factors.productId,
            newPrice: Math.round(newPrice * 100) / 100,
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
    calculateDemandAdjustment(elasticity) {
        if (elasticity > 0.8)
            return -0.05;
        if (elasticity < 0.2)
            return 0.05;
        return 0;
    }
    calculateInventoryAdjustment(inventoryLevel) {
        if (inventoryLevel < 0.1)
            return 0.1;
        if (inventoryLevel < 0.3)
            return 0.05;
        if (inventoryLevel > 0.8)
            return -0.05;
        return 0;
    }
    calculateTimeAdjustment(timeFactor) {
        return timeFactor * 0.02;
    }
    calculateCompetitorAdjustment(currentPrice, competitorPrice) {
        const priceDifference = (competitorPrice - currentPrice) / currentPrice;
        if (priceDifference > 0.1)
            return 0.05;
        if (priceDifference < -0.1)
            return -0.05;
        return 0;
    }
    calculateUserSegmentAdjustment(userSegment) {
        const segmentAdjustments = {
            'new_customer': -0.03,
            'returning_customer': 0,
            'vip_customer': -0.05,
            'price_sensitive': -0.02,
            'premium': 0.02
        };
        return segmentAdjustments[userSegment] || 0;
    }
    calculateHistoricalAdjustment(performance) {
        if (performance > 0.8)
            return 0.03;
        if (performance < 0.3)
            return -0.03;
        return 0;
    }
    calculateExternalAdjustment(factors) {
        let adjustment = 0;
        if (factors.weather) {
            adjustment += factors.weather * 0.01;
        }
        if (factors.economicIndicator) {
            adjustment += factors.economicIndicator * 0.005;
        }
        adjustment += factors.seasonality * 0.02;
        return adjustment;
    }
    combineAdjustments(adjustments) {
        const weights = {
            demandAdjustment: 0.25,
            inventoryAdjustment: 0.20,
            timeAdjustment: 0.15,
            competitorAdjustment: 0.15,
            userSegmentAdjustment: 0.10,
            historicalAdjustment: 0.10,
            externalAdjustment: 0.05
        };
        return (adjustments.demandAdjustment * weights.demandAdjustment +
            adjustments.inventoryAdjustment * weights.inventoryAdjustment +
            adjustments.timeAdjustment * weights.timeAdjustment +
            adjustments.competitorAdjustment * weights.competitorAdjustment +
            adjustments.userSegmentAdjustment * weights.userSegmentAdjustment +
            adjustments.historicalAdjustment * weights.historicalAdjustment +
            adjustments.externalAdjustment * weights.externalAdjustment);
    }
    async calculateConfidence(factors, adjustment) {
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
        }
        catch (error) {
            console.error('Bedrock confidence calculation failed:', error);
            return 0.7;
        }
    }
}
exports.MultiFactorPricingEngine = MultiFactorPricingEngine;
const handler = async (event) => {
    try {
        const pricingEngine = new MultiFactorPricingEngine();
        const result = await pricingEngine.calculateOptimalPrice(event.factors);
        return {
            statusCode: 200,
            body: JSON.stringify(result)
        };
    }
    catch (error) {
        console.error('Error in pricing engine:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Internal server error' })
        };
    }
};
exports.handler = handler;
//# sourceMappingURL=multi-factor-pricing.js.map
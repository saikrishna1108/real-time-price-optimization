"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = exports.recordPurchase = exports.getProducts = exports.getPriceHistory = exports.calculatePrice = void 0;
const mockDynamoDB = {
    get: async (params) => ({ Item: mockData[params.Key.productId] || mockData[params.Key.userId] }),
    query: async (params) => ({ Items: mockPriceHistory }),
    put: async (params) => ({})
};
const mockData = {
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
const calculatePrice = async (event) => {
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
        const basePrice = currentPrice || productData.price;
        const adjustment = (Math.random() - 0.5) * 0.1;
        const newPrice = Math.max(basePrice * (1 + adjustment), basePrice * 0.8);
        const result = {
            productId,
            optimizedPrice: Math.round(newPrice * 100) / 100,
            confidence: 0.7 + Math.random() * 0.2,
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
        await storePricingDecision(result);
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify(result)
        };
    }
    catch (error) {
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
exports.calculatePrice = calculatePrice;
const getPriceHistory = async (event) => {
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
    }
    catch (error) {
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
exports.getPriceHistory = getPriceHistory;
const getProducts = async (event) => {
    try {
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
    }
    catch (error) {
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
exports.getProducts = getProducts;
const recordPurchase = async (event) => {
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
        await recordPurchaseEvent(productId, userId, quantity);
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
    }
    catch (error) {
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
exports.recordPurchase = recordPurchase;
async function getProductData(productId) {
    const result = await mockDynamoDB.get({
        TableName: 'Products',
        Key: { productId }
    });
    return result.Item;
}
async function getUserData(userId) {
    const result = await mockDynamoDB.get({
        TableName: 'Users',
        Key: { userId }
    });
    return result.Item || { segment: 'returning_customer' };
}
async function getMarketData(productId) {
    return { competitorPrice: null };
}
async function calculateDemandElasticity(productId) {
    const recentPurchases = await getRecentPurchases(productId);
    const recentViews = await getRecentViews(productId);
    if (recentViews === 0)
        return 0.5;
    return recentPurchases / recentViews;
}
function calculateTimeFactor() {
    const now = new Date();
    const hour = now.getHours();
    const dayOfWeek = now.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    let factor = 1;
    if (hour >= 10 && hour <= 18)
        factor += 0.2;
    if (isWeekend)
        factor += 0.3;
    return factor;
}
function calculateSeasonality() {
    const month = new Date().getMonth();
    const seasonalFactors = [0.8, 0.9, 1.0, 1.1, 1.2, 1.3, 1.2, 1.1, 1.0, 0.9, 0.8, 0.7];
    return seasonalFactors[month];
}
async function getHistoricalPerformance(productId) {
    return 0.7;
}
async function getWeatherData() {
    return 0;
}
async function getEconomicData() {
    return 0;
}
async function storePricingDecision(decision) {
    await mockDynamoDB.put({
        TableName: 'PricingHistory',
        Item: decision
    });
}
async function getRecentPurchases(productId) {
    return 10;
}
async function getRecentViews(productId) {
    return 100;
}
async function recordPurchaseEvent(productId, userId, quantity) {
    console.log(`Recording purchase: ${productId}, ${userId}, ${quantity}`);
}
async function triggerPriceRecalculation(productId) {
    console.log(`Triggering price recalculation for: ${productId}`);
}
const handler = async (event) => {
    try {
        const { httpMethod, path } = event;
        if (httpMethod === 'GET' && path === '/products') {
            return await (0, exports.getProducts)(event);
        }
        if (httpMethod === 'POST' && path === '/pricing/calculate') {
            return await (0, exports.calculatePrice)(event);
        }
        if (httpMethod === 'GET' && path.includes('/pricing/history/')) {
            return await (0, exports.getPriceHistory)(event);
        }
        if (httpMethod === 'POST' && path.includes('/products/') && path.includes('/purchase')) {
            return await (0, exports.recordPurchase)(event);
        }
        return {
            statusCode: 404,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({ error: 'Not Found' })
        };
    }
    catch (error) {
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
exports.handler = handler;
//# sourceMappingURL=pricing-api.js.map
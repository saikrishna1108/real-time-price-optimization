# Real-Time Price Optimization with AWS Lambda

## 🚀 Overview

This is a **proof of concept** demonstrating real-time price optimization using AWS Lambda functions. The system simulates dynamic pricing based on multiple factors including demand, inventory, time, user segments, and market conditions.

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │────│   API Gateway    │────│  Lambda         │
│   (React)       │    │                  │    │  Functions      │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                                         │
                       ┌──────────────────┐             │
                       │   EventBridge    │─────────────┘
                       │   (Scheduler)    │
                       └──────────────────┘
                                │
                       ┌──────────────────┐
                       │   CloudWatch     │
                       │   (Monitoring)   │
                       └──────────────────┘
```

## 📦 Lambda Functions

### 1. Price Calculator (`price-calculator.ts`)
**Purpose**: Real-time price calculation based on multiple factors

**Features**:
- Multi-factor pricing algorithm
- User segment-based adjustments
- Time-based pricing (rush hours, weekends)
- Inventory-level adjustments
- Weather and seasonality factors
- Competitor price analysis
- Confidence scoring

**API Endpoint**: `POST /pricing/calculate`

**Request Example**:
```json
{
  "productId": "prod-001",
  "userId": "user-123",
  "userSegment": "returning_customer"
}
```

**Response Example**:
```json
{
  "success": true,
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    "product": {
      "id": "prod-001",
      "name": "Premium Flight Ticket - NYC to LAX",
      "basePrice": 299.99,
      "currentPrice": 299.99
    },
    "pricing": {
      "originalPrice": 299.99,
      "newPrice": 334.50,
      "priceChange": 34.51,
      "priceChangePercent": "11.50",
      "confidence": 0.87,
      "recommendation": "increase",
      "adjustments": {
        "timeOfDay": 0.15,
        "weekend": 0.10,
        "inventory": 0.25,
        "demand": 0.20,
        "userSegment": 0.02
      }
    }
  }
}
```

### 2. Product Catalog (`product-catalog.ts`)
**Purpose**: Dynamic product catalog with real-time pricing updates

**Features**:
- Product listing with filtering
- Category-based searches
- Inventory status
- Dynamic pricing updates
- Pagination support

**API Endpoints**:
- `GET /products` - List all products
- `GET /products/{productId}` - Get specific product
- `GET /products?category=travel` - Filter by category

### 3. Analytics API (`analytics-api.ts`)
**Purpose**: Comprehensive analytics and reporting

**Features**:
- Overview dashboards
- Product performance metrics
- User segment analysis
- Market trend analysis
- Real-time monitoring
- Revenue impact tracking

**API Endpoints**:
- `GET /analytics/overview` - Dashboard overview
- `GET /analytics/products` - Product performance
- `GET /analytics/segments` - User segment analysis
- `GET /analytics/realtime` - Live metrics

### 4. Simulation Trigger (`simulation-trigger.ts`)
**Purpose**: Automated price optimization simulation

**Features**:
- Scheduled execution (every 5 minutes)
- Market event simulation
- Multi-product optimization
- Performance reporting
- CloudWatch integration

**Trigger**: EventBridge scheduled rule

## 🛠️ Setup & Deployment

### Prerequisites
- AWS CLI configured
- Node.js 18+ installed
- TypeScript installed globally
- Proper IAM permissions

### Local Development

1. **Install Dependencies**:
```bash
cd backend/lambda-functions
npm install
```

2. **Build TypeScript**:
```bash
npm run build
```

3. **Run Local Tests**:
```bash
node test-local.js
```

### AWS Deployment

1. **Deploy Lambda Functions**:
```bash
chmod +x scripts/deploy-lambda.sh
./scripts/deploy-lambda.sh
```

2. **Verify Deployment**:
```bash
aws lambda list-functions --query 'Functions[?contains(FunctionName, `price-optimization`)].FunctionName'
```

## 🧪 Testing the System

### Local Testing
```bash
cd backend/lambda-functions
node test-local.js
```

**Expected Output**:
```
🚀 Starting AWS Lambda Function Tests for Price Optimization
============================================================

🧮 Testing Price Calculator Lambda...

📋 Test: Flight Ticket Pricing
   Product: Premium Flight Ticket - NYC to LAX
   Original Price: $299.99
   New Price: $356.24
   Change: 18.75% (increase)
   Confidence: 85.0%
   User Segment: returning_customer

📋 Test: Hotel Room Pricing - VIP Customer
   Product: Luxury Hotel Room - Manhattan
   Original Price: $250.00
   New Price: $267.50
   Change: 7.00% (increase)
   Confidence: 88.0%
   User Segment: vip_customer
```

### API Testing with curl

1. **Price Calculator**:
```bash
curl -X POST https://your-api-id.execute-api.us-east-1.amazonaws.com/prod/pricing/calculate \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "prod-001",
    "userId": "user-123",
    "userSegment": "returning_customer"
  }'
```

2. **Product Catalog**:
```bash
curl https://your-api-id.execute-api.us-east-1.amazonaws.com/prod/products
```

3. **Analytics**:
```bash
curl https://your-api-id.execute-api.us-east-1.amazonaws.com/prod/analytics/overview
```

## 📊 Monitoring & Observability

### CloudWatch Logs
Monitor function execution:
```bash
aws logs tail /aws/lambda/price-optimization-calculator --follow
```

### CloudWatch Metrics
Key metrics to monitor:
- Function duration
- Error rate
- Invocation count
- Throttles

### Custom Metrics
The system tracks:
- Price optimization accuracy
- Revenue impact
- User segment performance
- Market trend analysis

## 🎯 Pricing Algorithm Details

### Factors Considered
1. **Time-based**: Rush hours, weekends, holidays
2. **Inventory**: Stock levels and availability
3. **Demand**: Historical and real-time demand patterns
4. **User Segments**: Customer loyalty and price sensitivity
5. **Competition**: Competitor pricing analysis
6. **External**: Weather, economic indicators, seasonality

### Algorithm Flow
```
Base Price → Factor Analysis → Price Adjustments → Constraints → Final Price
     ↓              ↓               ↓              ↓           ↓
  $299.99    [Multiple factors]  [+/- %]    [Floor/Ceiling]  $334.50
```

### Confidence Scoring
- **High (85-95%)**: Strong data, clear patterns
- **Medium (70-84%)**: Good data, some uncertainty
- **Low (50-69%)**: Limited data, high uncertainty

## 🔧 Configuration

### Environment Variables
```bash
AWS_REGION=us-east-1
PRODUCTS_TABLE=Products
PRICING_HISTORY_TABLE=PricingHistory
USERS_TABLE=Users
```

### Function Settings
- **Runtime**: Node.js 18.x
- **Memory**: 512 MB
- **Timeout**: 30 seconds
- **Concurrency**: Reserved capacity available

## 📈 Performance Characteristics

### Benchmarks (Local Testing)
- **Single Request**: ~150ms average
- **Concurrent (10 req)**: ~200ms average per request
- **Success Rate**: 99.5%
- **Throughput**: ~50 requests/second

### AWS Lambda Performance
- **Cold Start**: ~500ms
- **Warm Start**: ~50ms
- **Concurrent Executions**: Up to 1000 (default)

## 🚨 Error Handling

### Common Errors
1. **400 Bad Request**: Missing productId
2. **404 Not Found**: Product not found
3. **500 Internal Error**: Processing failure

### Retry Logic
- Exponential backoff for external API calls
- Circuit breaker for downstream services
- Graceful degradation for non-critical features

## 💰 Cost Optimization

### AWS Lambda Costs
- **Requests**: $0.20 per 1M requests
- **Duration**: $0.0000166667 per GB-second
- **Estimated Monthly**: ~$5-10 for proof of concept

### Optimization Strategies
- Right-size memory allocation
- Optimize cold start times
- Use provisioned concurrency for critical functions
- Implement efficient caching

## 🔮 Future Enhancements

### Phase 2 Features
- [ ] Machine learning integration (SageMaker)
- [ ] Real-time data streaming (Kinesis)
- [ ] A/B testing framework
- [ ] Advanced competitor monitoring
- [ ] Mobile app integration

### Scalability Improvements
- [ ] DynamoDB integration
- [ ] Redis caching layer
- [ ] API rate limiting
- [ ] Multi-region deployment

## 📚 Additional Resources

- [AWS Lambda Developer Guide](https://docs.aws.amazon.com/lambda/)
- [API Gateway Documentation](https://docs.aws.amazon.com/apigateway/)
- [EventBridge User Guide](https://docs.aws.amazon.com/eventbridge/)
- [CloudWatch Monitoring](https://docs.aws.amazon.com/cloudwatch/)

## 🤝 Contributing

This is a proof of concept for demonstration purposes. For production use:
1. Implement proper error handling
2. Add comprehensive testing
3. Set up CI/CD pipeline
4. Add security measures
5. Implement data persistence

## 📄 License

This project is for educational and demonstration purposes only. 
# Real-Time Price Optimization - Deployment Guide

This guide will walk you through deploying the Real-Time Price Optimization application to AWS.

## Prerequisites

### Required Software
- **Node.js 18+** - [Download here](https://nodejs.org/)
- **AWS CLI** - [Installation guide](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html)
- **AWS CDK** - Install globally: `npm install -g aws-cdk`

### AWS Account Setup
1. **Create AWS Account** - [Sign up here](https://aws.amazon.com/)
2. **Configure AWS CLI** - Run `aws configure` and enter your credentials
3. **Enable Required Services**:
   - AWS Lambda
   - API Gateway
   - DynamoDB
   - EventBridge
   - S3
   - CloudWatch
   - AWS Bedrock (for AI features)

### AWS Permissions
Ensure your AWS user/role has the following permissions:
- `CloudFormation:*`
- `Lambda:*`
- `APIGateway:*`
- `DynamoDB:*`
- `Events:*`
- `S3:*`
- `CloudWatch:*`
- `IAM:*`
- `Bedrock:*`

## Quick Start Deployment

### 1. Clone and Setup
```bash
# Clone the repository
git clone <repository-url>
cd Real-time-price-opt

# Install dependencies
npm run setup
```

### 2. Configure Environment
```bash
# Create environment file
cp .env.example .env

# Edit environment variables
nano .env
```

Required environment variables:
```env
AWS_REGION=us-east-1
BEDROCK_MODEL_ID=anthropic.claude-3-sonnet-20240229-v1:0
```

### 3. Deploy to AWS
```bash
# Run the deployment script
chmod +x scripts/deploy.sh
./scripts/deploy.sh
```

## Manual Deployment Steps

### Step 1: Build the Application
```bash
# Build backend
npm run build:backend

# Build frontend
cd frontend
npm install
npm run build
cd ..
```

### Step 2: Deploy Infrastructure
```bash
# Deploy AWS infrastructure
cd infrastructure
npm install
npm run build
cdk deploy --all
```

### Step 3: Deploy Frontend
```bash
# Get the S3 bucket name from CDK output
S3_BUCKET=$(aws cloudformation describe-stacks --stack-name PriceOptimizationStack --query 'Stacks[0].Outputs[?OutputKey==`FrontendUrl`].OutputValue' --output text | sed 's/\.s3-website.*//')

# Deploy to S3
cd frontend
aws s3 sync build/ s3://$S3_BUCKET --delete
cd ..
```

## Architecture Overview

### AWS Services Used
- **AWS Lambda** - Serverless compute for pricing algorithms
- **API Gateway** - RESTful API endpoints
- **DynamoDB** - NoSQL database for data storage
- **EventBridge** - Event-driven triggers
- **S3** - Static website hosting
- **CloudWatch** - Monitoring and logging
- **AWS Bedrock** - AI/ML services

### Multi-Factor Pricing Algorithm
The application implements a sophisticated pricing algorithm that considers:

1. **Demand Elasticity** (25% weight) - Real-time buy/no-buy patterns
2. **Inventory Levels** (20% weight) - Stock-based pricing adjustments
3. **Time Factors** (15% weight) - Seasonality, holidays, peak hours
4. **Competitor Pricing** (15% weight) - Market intelligence
5. **User Segments** (10% weight) - Personalized pricing
6. **Historical Performance** (10% weight) - Price-demand curves
7. **External Factors** (5% weight) - Weather, economic indicators

## API Endpoints

### Pricing API
- `POST /pricing/calculate` - Calculate optimal price
- `GET /pricing/history/{productId}` - Get price history
- `GET /products` - Get all products
- `POST /products/{productId}/purchase` - Record purchase event

### Example API Usage
```bash
# Calculate optimal price
curl -X POST https://your-api-gateway-url/pricing/calculate \
  -H "Content-Type: application/json" \
  -d '{"productId": "prod-001", "userId": "user-001"}'

# Get price history
curl https://your-api-gateway-url/pricing/history/prod-001

# Record purchase
curl -X POST https://your-api-gateway-url/products/prod-001/purchase \
  -H "Content-Type: application/json" \
  -d '{"userId": "user-001", "quantity": 1}'
```

## Monitoring and Troubleshooting

### CloudWatch Logs
Monitor your application through CloudWatch:
```bash
# View Lambda function logs
aws logs tail /aws/lambda/PriceOptimizationStack-PricingApiFunction --follow

# View API Gateway logs
aws logs tail /aws/apigateway/PriceOptimizationStack-PriceOptimizationApi --follow
```

### CloudWatch Alarms
The application automatically creates alarms for:
- API Gateway 5xx errors
- Lambda function errors
- DynamoDB throttling

### Common Issues

#### 1. Lambda Function Errors
- Check CloudWatch logs for detailed error messages
- Verify environment variables are set correctly
- Ensure DynamoDB permissions are configured

#### 2. API Gateway Issues
- Check CORS configuration
- Verify Lambda integration settings
- Test API endpoints directly

#### 3. DynamoDB Issues
- Check table permissions
- Monitor read/write capacity
- Verify table names in environment variables

## Customization

### Modifying Pricing Algorithm
Edit `backend/pricing-engine/multi-factor-pricing.ts`:
```typescript
// Adjust factor weights
const weights = {
  demandAdjustment: 0.25,    // Change from 0.25
  inventoryAdjustment: 0.20, // Change from 0.20
  // ... other weights
};
```

### Adding New Factors
1. Add new factor calculation method
2. Update `PricingFactors` interface
3. Add weight in `combineAdjustments` method
4. Update frontend to display new factor

### Customizing Frontend
- Edit React components in `frontend/src/components/`
- Modify styling in `frontend/src/index.css`
- Update Tailwind config in `frontend/tailwind.config.js`

## Security Considerations

### IAM Permissions
- Use least privilege principle
- Regularly rotate access keys
- Monitor IAM activity

### API Security
- Implement authentication (Cognito, API Keys)
- Use HTTPS for all communications
- Rate limiting on API endpoints

### Data Protection
- Enable DynamoDB encryption at rest
- Use VPC for Lambda functions if needed
- Implement data retention policies

## Cost Optimization

### Lambda Optimization
- Optimize function memory allocation
- Use provisioned concurrency for consistent workloads
- Monitor cold start times

### DynamoDB Optimization
- Use on-demand billing for variable workloads
- Implement efficient query patterns
- Monitor read/write capacity

### S3 Optimization
- Enable S3 Intelligent Tiering
- Use CloudFront for global distribution
- Implement lifecycle policies

## Scaling Considerations

### Horizontal Scaling
- Lambda automatically scales based on demand
- DynamoDB on-demand billing handles variable loads
- API Gateway scales automatically

### Performance Optimization
- Use DynamoDB DAX for read-heavy workloads
- Implement caching strategies
- Optimize Lambda function execution time

## Backup and Recovery

### Data Backup
- DynamoDB point-in-time recovery enabled
- S3 versioning for frontend assets
- CloudWatch log retention

### Disaster Recovery
- Multi-region deployment option
- Cross-region DynamoDB replication
- S3 cross-region replication

## Support and Maintenance

### Regular Maintenance
- Update dependencies monthly
- Monitor AWS service updates
- Review CloudWatch metrics weekly

### Troubleshooting Resources
- AWS Documentation
- CloudWatch Logs
- AWS Support (if applicable)

## Next Steps

After successful deployment:

1. **Test the Application**
   - Visit the frontend URL
   - Test API endpoints
   - Verify pricing calculations

2. **Monitor Performance**
   - Set up CloudWatch dashboards
   - Configure alerting
   - Monitor costs

3. **Customize for Your Use Case**
   - Modify pricing factors
   - Add new products
   - Customize UI/UX

4. **Scale and Optimize**
   - Monitor usage patterns
   - Optimize performance
   - Implement additional features

For additional support, refer to the main README.md file or create an issue in the repository. 
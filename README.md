# Real-Time Price Optimization Platform

A sophisticated, serverless AWS-based application that implements a Multi-Factor Pricing Algorithm for dynamic price optimization across various industries including e-commerce, travel, and marketplaces.

## 🏗️ Architecture

### Core Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    Real-Time Price Optimization Platform        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────┐    ┌─────────────────┐    ┌──────────────┐ │
│  │   Frontend      │    │   API Gateway   │    │   EventBridge│ │
│  │   (React SPA)   │◄──►│   (REST API)    │◄──►│   (Events)   │ │
│  └─────────────────┘    └─────────────────┘    └──────────────┘ │
│           │                       │                      │      │
│           │                       │                      │      │
│           ▼                       ▼                      ▼      │
│  ┌─────────────────┐    ┌─────────────────┐    ┌──────────────┐ │
│  │   S3 Bucket     │    │   AWS LAMBDA    │    │   AWS LAMBDA │ │
│  │  (Static Host)  │    │   (Core Engine) │    │ (Event Proc) │ │
│  └─────────────────┘    └─────────────────┘    └──────────────┘ │
│                                   │                             │
│                                   ▼                             │
│                          ┌─────────────────┐                    │
│                          │   DynamoDB      │                    │
│                          │  (Data Store)   │                    │
│                          └─────────────────┘                    │
│                                   │                             │
│                                   ▼                             │
│                          ┌─────────────────┐                    │
│                          │   AWS Bedrock   │                    │
│                          │   (AI/ML)       │                    │
│                          └─────────────────┘                    │
└─────────────────────────────────────────────────────────────────┘
```

### AWS Lambda as the Core Engine

**AWS Lambda** serves as the heart of our real-time price optimization platform, providing:

#### 🚀 Lambda Functions Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    AWS LAMBDA CORE FUNCTIONS                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │              Multi-Factor Pricing Engine                   │ │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐          │ │
│  │  │   Demand    │ │  Inventory  │ │   Time      │          │ │
│  │  │ Elasticity  │ │  Levels     │ │  Factors    │          │ │
│  │  └─────────────┘ └─────────────┘ └─────────────┘          │ │
│  │                                                             │ │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐          │ │
│  │  │ Competitor  │ │   User      │ │ Historical  │          │ │
│  │  │  Pricing    │ │ Segments    │ │Performance  │          │ │
│  │  └─────────────┘ └─────────────┘ └─────────────┘          │ │
│  │                                                             │ │
│  │  ┌─────────────┐                                           │ │
│  │  │  External   │                                           │ │
│  │  │  Factors    │                                           │ │
│  │  └─────────────┘                                           │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                              │                                  │
│                              ▼                                  │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │              API Handlers & Event Processors               │ │
│  │                                                             │ │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐          │ │
│  │  │ Pricing API │ │ Price       │ │ Analytics   │          │ │
│  │  │ Handler     │ │ Trigger     │ │ API         │          │ │
│  │  └─────────────┘ └─────────────┘ └─────────────┘          │ │
│  │                                                             │ │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐          │ │
│  │  │ Product     │ │ Simulation  │ │ Test Local  │          │ │
│  │  │ Catalog     │ │ Trigger     │ │ Handler     │          │ │
│  │  └─────────────┘ └─────────────┘ └─────────────┘          │ │
│  └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

#### ⚡ Lambda Execution Flow

```
1. Event Trigger (API Gateway/EventBridge)
   ↓
2. Lambda Function Invocation
   ↓
3. Multi-Factor Pricing Algorithm Execution
   ├── Demand Elasticity Analysis
   ├── Inventory Level Assessment
   ├── Time Factor Calculation
   ├── Competitor Price Comparison
   ├── User Segment Analysis
   ├── Historical Performance Review
   └── External Factors Evaluation
   ↓
4. AWS Bedrock AI Integration (Confidence Scoring)
   ↓
5. DynamoDB Data Persistence
   ↓
6. Real-time Response/Event Emission
```

### AWS Services Integration

#### 🎯 Lambda-Centric Architecture

- **AWS Lambda** - **Core compute engine** for all pricing operations
- **API Gateway** - RESTful endpoints that trigger Lambda functions
- **EventBridge** - Event-driven triggers for scheduled Lambda executions
- **DynamoDB** - NoSQL database accessed by Lambda functions
- **S3** - Static hosting for frontend, data storage for Lambda
- **CloudWatch** - Monitoring Lambda performance and errors
- **AWS Bedrock** - AI/ML services integrated with Lambda for confidence scoring

#### 🔄 Event-Driven Architecture

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Frontend  │───►│ API Gateway │───►│   Lambda    │
│  (User)     │    │             │    │  Functions  │
└─────────────┘    └─────────────┘    └─────────────┘
                           │                   │
                           ▼                   ▼
                   ┌─────────────┐    ┌─────────────┐
                   │ EventBridge │───►│   Lambda    │
                   │ (Scheduled) │    │  Functions  │
                   └─────────────┘    └─────────────┘
                                              │
                                              ▼
                                     ┌─────────────┐
                                     │  DynamoDB   │
                                     │ (Data Store)│
                                     └─────────────┘
```

### Multi-Factor Pricing Algorithm

The application implements a sophisticated pricing algorithm that considers 7 key factors:

- **Demand Elasticity** - Real-time buy/no-buy patterns and price sensitivity
- **Inventory Levels** - Stock-based pricing adjustments
- **Time Factors** - Seasonality, holidays, peak hours
- **Competitor Pricing** - Market intelligence and competitive positioning
- **User Segments** - Personalized pricing strategies
- **Historical Performance** - Price-demand curve analysis
- **External Factors** - Weather, economic indicators, market conditions

## 🚀 Features

- **Real-time Price Updates** - WebSocket-based live price updates
- **Multi-Factor Pricing Algorithm** - Advanced 7-factor pricing model
- **A/B Testing Framework** - Built-in experimentation capabilities
- **Analytics Dashboard** - Comprehensive performance monitoring
- **Price History Tracking** - Complete audit trail of price changes
- **User Behavior Analysis** - Personalized pricing based on segments
- **AI-Powered Confidence Scoring** - AWS Bedrock integration for ML insights

## 📁 Project Structure

```
Real-time-price-opt/
├── backend/                    # Backend services
│   ├── api-handlers/          # API Gateway handlers
│   ├── event-processors/      # EventBridge processors
│   ├── lambda-functions/      # Core Lambda functions
│   └── pricing-engine/        # Multi-factor pricing algorithm
├── frontend/                  # React TypeScript application
├── infrastructure/            # AWS CDK infrastructure
├── docs/                     # Documentation
└── scripts/                  # Deployment scripts
```

## 🛠️ Technology Stack

### Backend
- **Node.js 18+** - Runtime environment
- **TypeScript** - Type-safe development
- **AWS SDK v3** - AWS service integration
- **AWS Bedrock** - AI/ML capabilities

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling framework
- **Recharts** - Data visualization
- **Socket.io** - Real-time updates

### Infrastructure
- **AWS CDK** - Infrastructure as Code
- **TypeScript** - CDK definitions

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- AWS CLI configured
- AWS CDK installed globally: `npm install -g aws-cdk`

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Real-time-price-opt
   ```

2. **Install dependencies**
   ```bash
   npm run setup
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your AWS configuration
   ```

4. **Deploy to AWS**
   ```bash
   chmod +x scripts/deploy.sh
   ./scripts/deploy.sh
   ```

## 📡 API Endpoints

- `POST /pricing/calculate` - Calculate optimal price for a product
- `GET /pricing/history/{productId}` - Retrieve price history
- `GET /products` - Get all available products
- `POST /products/{productId}/purchase` - Record purchase events

## 🎯 Use Cases

### E-commerce
- Dynamic pricing based on inventory levels
- Seasonal and holiday pricing adjustments
- Competitor price monitoring and response
- Personalized pricing for different customer segments

### Travel & Hospitality
- Flight pricing optimization
- Hotel room rate adjustments
- Weather-based pricing for travel packages
- Peak/off-peak pricing strategies

### Marketplaces
- Real-time auction pricing
- Supply-demand balancing
- Vendor performance-based pricing
- Market condition adjustments

## 📈 Monitoring & Analytics

### CloudWatch Integration
- **API Gateway Monitoring** - Track API performance and errors
- **Lambda Function Metrics** - Monitor execution times and errors
- **DynamoDB Performance** - Track read/write capacity and throttling
- **Custom Business Metrics** - Price change frequency and impact

### Built-in Alarms
- API Gateway 5xx errors
- Lambda function errors
- DynamoDB throttling

### Analytics Dashboard
- Real-time price change tracking
- Revenue impact analysis
- User behavior insights
- A/B test results visualization

## 🧪 Development

### Running Tests
```bash
# Run all tests
npm test

# Backend tests only
npm run test:backend

# Frontend tests only
npm run test:frontend
```

### Local Development
```bash
# Start development servers
npm run dev

# Backend only
npm run dev:backend

# Frontend only
npm run dev:frontend
```

## 📚 Documentation

- **[Deployment Guide](docs/DEPLOYMENT_GUIDE.md)** - Detailed deployment instructions
- **[Lambda Functions README](README_LAMBDA.md)** - Lambda function documentation

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the [Deployment Guide](docs/DEPLOYMENT_GUIDE.md) for common issues
- Review CloudWatch logs for debugging information

## 🔮 Roadmap

- [ ] Machine Learning model integration for better predictions
- [ ] Advanced competitor price scraping
- [ ] Multi-currency support
- [ ] Advanced A/B testing framework
- [ ] Mobile application
- [ ] Integration with popular e-commerce platforms
- [ ] Advanced analytics and reporting
- [ ] Real-time notifications and alerts

---

**Built with ❤️ using AWS Lambda as the core engine** - **Sai Krishna Reddy Mareddy**

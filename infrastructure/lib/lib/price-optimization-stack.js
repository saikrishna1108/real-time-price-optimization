"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PriceOptimizationStack = void 0;
const cdk = __importStar(require("aws-cdk-lib"));
const lambda = __importStar(require("aws-cdk-lib/aws-lambda"));
const apigateway = __importStar(require("aws-cdk-lib/aws-apigateway"));
const dynamodb = __importStar(require("aws-cdk-lib/aws-dynamodb"));
const events = __importStar(require("aws-cdk-lib/aws-events"));
const targets = __importStar(require("aws-cdk-lib/aws-events-targets"));
const s3 = __importStar(require("aws-cdk-lib/aws-s3"));
const iam = __importStar(require("aws-cdk-lib/aws-iam"));
const cloudwatch = __importStar(require("aws-cdk-lib/aws-cloudwatch"));
class PriceOptimizationStack extends cdk.Stack {
    constructor(scope, id, props) {
        super(scope, id, props);
        const productsTable = new dynamodb.Table(this, 'ProductsTable', {
            tableName: 'Products',
            partitionKey: { name: 'productId', type: dynamodb.AttributeType.STRING },
            billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
            removalPolicy: cdk.RemovalPolicy.DESTROY,
            pointInTimeRecovery: true
        });
        const pricingHistoryTable = new dynamodb.Table(this, 'PricingHistoryTable', {
            tableName: 'PricingHistory',
            partitionKey: { name: 'productId', type: dynamodb.AttributeType.STRING },
            sortKey: { name: 'timestamp', type: dynamodb.AttributeType.STRING },
            billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
            removalPolicy: cdk.RemovalPolicy.DESTROY,
            pointInTimeRecovery: true
        });
        const priceChangesTable = new dynamodb.Table(this, 'PriceChangesTable', {
            tableName: 'PriceChanges',
            partitionKey: { name: 'productId', type: dynamodb.AttributeType.STRING },
            sortKey: { name: 'timestamp', type: dynamodb.AttributeType.STRING },
            billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
            removalPolicy: cdk.RemovalPolicy.DESTROY,
            pointInTimeRecovery: true
        });
        const usersTable = new dynamodb.Table(this, 'UsersTable', {
            tableName: 'Users',
            partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
            billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
            removalPolicy: cdk.RemovalPolicy.DESTROY,
            pointInTimeRecovery: true
        });
        const pricingEngineFunction = new lambda.Function(this, 'PricingEngineFunction', {
            runtime: lambda.Runtime.NODEJS_18_X,
            handler: 'multi-factor-pricing.handler',
            code: lambda.Code.fromAsset('../backend/pricing-engine'),
            timeout: cdk.Duration.seconds(30),
            memorySize: 512,
            environment: {
                PRODUCTS_TABLE: productsTable.tableName,
                PRICING_HISTORY_TABLE: pricingHistoryTable.tableName,
                USERS_TABLE: usersTable.tableName,
                AWS_REGION: this.region
            }
        });
        const pricingApiFunction = new lambda.Function(this, 'PricingApiFunction', {
            runtime: lambda.Runtime.NODEJS_18_X,
            handler: 'pricing-api.handler',
            code: lambda.Code.fromAsset('../backend/api-handlers'),
            timeout: cdk.Duration.seconds(30),
            memorySize: 512,
            environment: {
                PRODUCTS_TABLE: productsTable.tableName,
                PRICING_HISTORY_TABLE: pricingHistoryTable.tableName,
                USERS_TABLE: usersTable.tableName,
                AWS_REGION: this.region
            }
        });
        const priceTriggerFunction = new lambda.Function(this, 'PriceTriggerFunction', {
            runtime: lambda.Runtime.NODEJS_18_X,
            handler: 'price-trigger.handler',
            code: lambda.Code.fromAsset('../backend/event-processors'),
            timeout: cdk.Duration.seconds(30),
            memorySize: 512,
            environment: {
                PRODUCTS_TABLE: productsTable.tableName,
                PRICE_CHANGES_TABLE: priceChangesTable.tableName,
                AWS_REGION: this.region
            }
        });
        productsTable.grantReadWriteData(pricingEngineFunction);
        productsTable.grantReadWriteData(pricingApiFunction);
        productsTable.grantReadWriteData(priceTriggerFunction);
        pricingHistoryTable.grantReadWriteData(pricingEngineFunction);
        pricingHistoryTable.grantReadWriteData(pricingApiFunction);
        priceChangesTable.grantReadWriteData(priceTriggerFunction);
        usersTable.grantReadData(pricingApiFunction);
        const bedrockPolicy = new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: [
                'bedrock:InvokeModel',
                'bedrock:InvokeModelWithResponseStream'
            ],
            resources: ['*']
        });
        pricingEngineFunction.addToRolePolicy(bedrockPolicy);
        const api = new apigateway.RestApi(this, 'PriceOptimizationApi', {
            restApiName: 'Price Optimization API',
            description: 'API for real-time price optimization',
            defaultCorsPreflightOptions: {
                allowOrigins: apigateway.Cors.ALL_ORIGINS,
                allowMethods: apigateway.Cors.ALL_METHODS,
                allowHeaders: ['Content-Type', 'Authorization']
            }
        });
        const pricingResource = api.root.addResource('pricing');
        const calculatePriceResource = pricingResource.addResource('calculate');
        const historyResource = pricingResource.addResource('history').addResource('{productId}');
        const productsResource = api.root.addResource('products');
        const productPurchaseResource = productsResource.addResource('{productId}').addResource('purchase');
        calculatePriceResource.addMethod('POST', new apigateway.LambdaIntegration(pricingApiFunction));
        historyResource.addMethod('GET', new apigateway.LambdaIntegration(pricingApiFunction));
        productsResource.addMethod('GET', new apigateway.LambdaIntegration(pricingApiFunction));
        productPurchaseResource.addMethod('POST', new apigateway.LambdaIntegration(pricingApiFunction));
        const priceTriggerRule = new events.Rule(this, 'PriceTriggerRule', {
            eventPattern: {
                source: ['price.optimization'],
                detailType: ['PriceTrigger']
            }
        });
        priceTriggerRule.addTarget(new targets.LambdaFunction(priceTriggerFunction));
        const scheduledOptimizationRule = new events.Rule(this, 'ScheduledOptimizationRule', {
            schedule: events.Schedule.rate(cdk.Duration.hours(1)),
            description: 'Trigger price optimization every hour'
        });
        scheduledOptimizationRule.addTarget(new targets.LambdaFunction(priceTriggerFunction));
        const frontendBucket = new s3.Bucket(this, 'FrontendBucket', {
            bucketName: `price-optimization-frontend-${this.account}`,
            websiteIndexDocument: 'index.html',
            websiteErrorDocument: 'error.html',
            publicReadAccess: true,
            removalPolicy: cdk.RemovalPolicy.DESTROY,
            autoDeleteObjects: true
        });
        const apiErrorsAlarm = new cloudwatch.Alarm(this, 'ApiErrorsAlarm', {
            metric: api.metricServerError({
                period: cdk.Duration.minutes(5)
            }),
            threshold: 5,
            evaluationPeriods: 2,
            alarmDescription: 'API Gateway 5xx errors'
        });
        const lambdaErrorsAlarm = new cloudwatch.Alarm(this, 'LambdaErrorsAlarm', {
            metric: pricingApiFunction.metricErrors({
                period: cdk.Duration.minutes(5)
            }),
            threshold: 3,
            evaluationPeriods: 2,
            alarmDescription: 'Lambda function errors'
        });
        const dynamoDBThrottlingAlarm = new cloudwatch.Alarm(this, 'DynamoDBThrottlingAlarm', {
            metric: productsTable.metricThrottledRequests({
                period: cdk.Duration.minutes(5)
            }),
            threshold: 10,
            evaluationPeriods: 2,
            alarmDescription: 'DynamoDB throttled requests'
        });
        new cdk.CfnOutput(this, 'ApiUrl', {
            value: api.url,
            description: 'API Gateway URL'
        });
        new cdk.CfnOutput(this, 'FrontendUrl', {
            value: frontendBucket.bucketWebsiteDomainName,
            description: 'Frontend Website URL'
        });
        new cdk.CfnOutput(this, 'ProductsTableName', {
            value: productsTable.tableName,
            description: 'Products DynamoDB Table Name'
        });
        new cdk.CfnOutput(this, 'PricingHistoryTableName', {
            value: pricingHistoryTable.tableName,
            description: 'Pricing History DynamoDB Table Name'
        });
    }
}
exports.PriceOptimizationStack = PriceOptimizationStack;

import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import { Construct } from 'constructs';

export class PriceOptimizationStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // DynamoDB Tables
    const productsTable = new dynamodb.Table(this, 'ProductsTable', {
      tableName: 'Products',
      partitionKey: { name: 'productId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      pointInTimeRecoverySpecification: {
        pointInTimeRecoveryEnabled: true
      }
    });

    const pricingHistoryTable = new dynamodb.Table(this, 'PricingHistoryTable', {
      tableName: 'PricingHistory',
      partitionKey: { name: 'productId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'timestamp', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      pointInTimeRecoverySpecification: {
        pointInTimeRecoveryEnabled: true
      }
    });

    const priceChangesTable = new dynamodb.Table(this, 'PriceChangesTable', {
      tableName: 'PriceChanges',
      partitionKey: { name: 'productId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'timestamp', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      pointInTimeRecoverySpecification: {
        pointInTimeRecoveryEnabled: true
      }
    });

    const usersTable = new dynamodb.Table(this, 'UsersTable', {
      tableName: 'Users',
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      pointInTimeRecoverySpecification: {
        pointInTimeRecoveryEnabled: true
      }
    });

    // Lambda Functions
    const pricingEngineFunction = new lambda.Function(this, 'PricingEngineFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'multi-factor-pricing.handler',
      code: lambda.Code.fromAsset('../backend/pricing-engine'),
      timeout: cdk.Duration.seconds(30),
      memorySize: 512,
      environment: {
        PRODUCTS_TABLE: productsTable.tableName,
        PRICING_HISTORY_TABLE: pricingHistoryTable.tableName,
        USERS_TABLE: usersTable.tableName
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
        USERS_TABLE: usersTable.tableName
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
        PRICE_CHANGES_TABLE: priceChangesTable.tableName
      }
    });

    // Grant DynamoDB permissions
    productsTable.grantReadWriteData(pricingEngineFunction);
    productsTable.grantReadWriteData(pricingApiFunction);
    productsTable.grantReadWriteData(priceTriggerFunction);

    pricingHistoryTable.grantReadWriteData(pricingEngineFunction);
    pricingHistoryTable.grantReadWriteData(pricingApiFunction);

    priceChangesTable.grantReadWriteData(priceTriggerFunction);

    usersTable.grantReadData(pricingApiFunction);

    // Grant Bedrock permissions
    const bedrockPolicy = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'bedrock:InvokeModel',
        'bedrock:InvokeModelWithResponseStream'
      ],
      resources: ['*']
    });

    pricingEngineFunction.addToRolePolicy(bedrockPolicy);

    // API Gateway
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

    // EventBridge Rules
    const priceTriggerRule = new events.Rule(this, 'PriceTriggerRule', {
      eventPattern: {
        source: ['price.optimization'],
        detailType: ['PriceTrigger']
      }
    });

    priceTriggerRule.addTarget(new targets.LambdaFunction(priceTriggerFunction));

    // Scheduled price optimization (every hour)
    const scheduledOptimizationRule = new events.Rule(this, 'ScheduledOptimizationRule', {
      schedule: events.Schedule.rate(cdk.Duration.hours(1)),
      description: 'Trigger price optimization every hour'
    });

    scheduledOptimizationRule.addTarget(new targets.LambdaFunction(priceTriggerFunction));

    // S3 Bucket for frontend
    const frontendBucket = new s3.Bucket(this, 'FrontendBucket', {
      bucketName: `price-optimization-frontend-${this.account}`,
      websiteIndexDocument: 'index.html',
      websiteErrorDocument: 'error.html',
      publicReadAccess: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ACLS,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true
    });

    // CloudWatch Alarms
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

    // Outputs
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
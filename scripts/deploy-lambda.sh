#!/bin/bash

# AWS Lambda Deployment Script for Price Optimization
# This script builds and deploys Lambda functions to AWS

set -e

echo "🚀 Starting Lambda deployment for Price Optimization..."

# Configuration
REGION="us-east-1"
LAMBDA_DIR="backend/lambda-functions"
BUILD_DIR="$LAMBDA_DIR/dist"
PACKAGE_DIR="$LAMBDA_DIR/packages"

# Function names
PRICE_CALCULATOR_FUNCTION="price-optimization-calculator"
PRODUCT_CATALOG_FUNCTION="price-optimization-catalog"
ANALYTICS_API_FUNCTION="price-optimization-analytics"
SIMULATION_TRIGGER_FUNCTION="price-optimization-simulator"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Helper functions
log_info() {
    echo -e "${GREEN}ℹ️  $1${NC}"
}

log_warn() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    log_error "AWS CLI is not installed. Please install it first."
    exit 1
fi

# Check if AWS credentials are configured
if ! aws sts get-caller-identity &> /dev/null; then
    log_error "AWS credentials not configured. Please run 'aws configure' first."
    exit 1
fi

log_info "AWS CLI configured. Using region: $REGION"

# Navigate to Lambda directory
cd "$LAMBDA_DIR"

# Install dependencies
log_info "Installing dependencies..."
npm install

# Build TypeScript
log_info "Building TypeScript..."
npm run build

# Create packages directory
mkdir -p "$PACKAGE_DIR"

# Function to create and deploy Lambda function
deploy_function() {
    local FUNCTION_NAME=$1
    local HANDLER_FILE=$2
    local DESCRIPTION=$3
    
    log_info "Deploying $FUNCTION_NAME..."
    
    # Create deployment package
    local PACKAGE_FILE="$PACKAGE_DIR/$FUNCTION_NAME.zip"
    
    # Copy built files and dependencies
    cp -r dist node_modules "$PACKAGE_DIR/temp_$FUNCTION_NAME/"
    cd "$PACKAGE_DIR/temp_$FUNCTION_NAME"
    
    # Create zip file
    zip -r "../$FUNCTION_NAME.zip" . -q
    cd ../..
    
    # Clean up temp directory
    rm -rf "$PACKAGE_DIR/temp_$FUNCTION_NAME"
    
    # Check if function exists
    if aws lambda get-function --function-name "$FUNCTION_NAME" --region "$REGION" &> /dev/null; then
        log_info "Function $FUNCTION_NAME exists. Updating code..."
        aws lambda update-function-code \
            --function-name "$FUNCTION_NAME" \
            --zip-file "fileb://$PACKAGE_FILE" \
            --region "$REGION" > /dev/null
    else
        log_info "Function $FUNCTION_NAME does not exist. Creating..."
        aws lambda create-function \
            --function-name "$FUNCTION_NAME" \
            --runtime nodejs18.x \
            --role "arn:aws:iam::$(aws sts get-caller-identity --query Account --output text):role/lambda-execution-role" \
            --handler "$HANDLER_FILE.handler" \
            --zip-file "fileb://$PACKAGE_FILE" \
            --description "$DESCRIPTION" \
            --timeout 30 \
            --memory-size 512 \
            --region "$REGION" > /dev/null
    fi
    
    log_info "✅ $FUNCTION_NAME deployed successfully"
}

# Deploy all Lambda functions
deploy_function "$PRICE_CALCULATOR_FUNCTION" "price-calculator" "Lambda function for real-time price calculation"
deploy_function "$PRODUCT_CATALOG_FUNCTION" "product-catalog" "Lambda function for product catalog API"
deploy_function "$ANALYTICS_API_FUNCTION" "analytics-api" "Lambda function for analytics and reporting API"
deploy_function "$SIMULATION_TRIGGER_FUNCTION" "simulation-trigger" "Lambda function for price optimization simulation"

# Create API Gateway (if it doesn't exist)
log_info "Setting up API Gateway..."

API_NAME="price-optimization-api"
API_ID=$(aws apigateway get-rest-apis --region "$REGION" --query "items[?name=='$API_NAME'].id" --output text)

if [ -z "$API_ID" ] || [ "$API_ID" == "None" ]; then
    log_info "Creating API Gateway..."
    API_ID=$(aws apigateway create-rest-api \
        --name "$API_NAME" \
        --description "API for Price Optimization System" \
        --region "$REGION" \
        --query 'id' --output text)
    log_info "Created API Gateway with ID: $API_ID"
else
    log_info "Using existing API Gateway with ID: $API_ID"
fi

# Set up EventBridge rule for simulation trigger
log_info "Setting up EventBridge rule for simulation..."

RULE_NAME="price-optimization-simulation-schedule"
if aws events describe-rule --name "$RULE_NAME" --region "$REGION" &> /dev/null; then
    log_info "EventBridge rule already exists"
else
    aws events put-rule \
        --name "$RULE_NAME" \
        --schedule-expression "rate(5 minutes)" \
        --description "Trigger price optimization simulation every 5 minutes" \
        --region "$REGION" > /dev/null
    
    # Add Lambda as target
    aws events put-targets \
        --rule "$RULE_NAME" \
        --targets "Id"="1","Arn"="arn:aws:lambda:$REGION:$(aws sts get-caller-identity --query Account --output text):function:$SIMULATION_TRIGGER_FUNCTION" \
        --region "$REGION" > /dev/null
    
    # Add permission for EventBridge to invoke Lambda
    aws lambda add-permission \
        --function-name "$SIMULATION_TRIGGER_FUNCTION" \
        --statement-id "allow-eventbridge" \
        --action "lambda:InvokeFunction" \
        --principal "events.amazonaws.com" \
        --source-arn "arn:aws:events:$REGION:$(aws sts get-caller-identity --query Account --output text):rule/$RULE_NAME" \
        --region "$REGION" > /dev/null
    
    log_info "✅ EventBridge rule created and configured"
fi

# Clean up
log_info "Cleaning up build artifacts..."
rm -rf "$PACKAGE_DIR"

# Display function URLs (if available)
log_info "Lambda Functions deployed:"
echo "1. Price Calculator: $PRICE_CALCULATOR_FUNCTION"
echo "2. Product Catalog: $PRODUCT_CATALOG_FUNCTION"
echo "3. Analytics API: $ANALYTICS_API_FUNCTION"
echo "4. Simulation Trigger: $SIMULATION_TRIGGER_FUNCTION"

log_info "API Gateway ID: $API_ID"
log_info "API Gateway URL: https://$API_ID.execute-api.$REGION.amazonaws.com/prod"

echo ""
log_info "🎉 Lambda deployment completed successfully!"
echo ""
log_warn "Note: Make sure you have the required IAM roles and permissions configured:"
echo "- lambda-execution-role with appropriate policies"
echo "- API Gateway permissions to invoke Lambda functions"
echo "- EventBridge permissions to trigger Lambda functions"
echo ""
log_info "To test the deployment, you can:"
echo "1. Check Lambda function logs in CloudWatch"
echo "2. Test API endpoints using the API Gateway URL"
echo "3. Monitor EventBridge rule executions" 
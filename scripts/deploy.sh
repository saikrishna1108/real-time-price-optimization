#!/bin/bash

# Real-Time Price Optimization Application Deployment Script
# This script deploys the entire application to AWS

set -e

echo "🚀 Starting deployment of Real-Time Price Optimization Application..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    print_error "AWS CLI is not installed. Please install it first."
    exit 1
fi

# Check if AWS credentials are configured
if ! aws sts get-caller-identity &> /dev/null; then
    print_error "AWS credentials are not configured. Please run 'aws configure' first."
    exit 1
fi

# Check if CDK is installed
if ! command -v cdk &> /dev/null; then
    print_error "AWS CDK is not installed. Please install it first: npm install -g aws-cdk"
    exit 1
fi

# Get current directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

print_status "Project root: $PROJECT_ROOT"

# Navigate to project root
cd "$PROJECT_ROOT"

# Install dependencies
print_status "Installing dependencies..."
npm install

# Build backend
print_status "Building backend..."
npm run build:backend

# Build frontend
print_status "Building frontend..."
cd frontend
npm install
npm run build
cd ..

# Deploy infrastructure
print_status "Deploying AWS infrastructure..."
cd infrastructure
npm install
npm run build
cdk deploy --all --require-approval never

# Get deployment outputs
print_status "Getting deployment outputs..."
API_URL=$(aws cloudformation describe-stacks --stack-name PriceOptimizationStack --query 'Stacks[0].Outputs[?OutputKey==`ApiUrl`].OutputValue' --output text)
FRONTEND_URL=$(aws cloudformation describe-stacks --stack-name PriceOptimizationStack --query 'Stacks[0].Outputs[?OutputKey==`FrontendUrl`].OutputValue' --output text)

# Deploy frontend to S3
print_status "Deploying frontend to S3..."
cd frontend
aws s3 sync build/ s3://price-optimization-frontend-$(aws sts get-caller-identity --query Account --output text) --delete
cd ..

# Update frontend configuration with API URL
print_status "Updating frontend configuration..."
sed -i "s|REACT_APP_API_URL=.*|REACT_APP_API_URL=$API_URL|" frontend/.env

print_success "Deployment completed successfully!"
echo ""
echo "📊 Deployment Summary:"
echo "  API Gateway URL: $API_URL"
echo "  Frontend URL: $FRONTEND_URL"
echo ""
echo "🔗 Quick Links:"
echo "  - Frontend Application: http://$FRONTEND_URL"
echo "  - API Documentation: $API_URL"
echo ""
echo "📋 Next Steps:"
echo "  1. Test the application by visiting the frontend URL"
echo "  2. Monitor CloudWatch logs for any issues"
echo "  3. Set up additional monitoring and alerting as needed"
echo ""
print_success "Real-Time Price Optimization Application is now live! 🎉" 
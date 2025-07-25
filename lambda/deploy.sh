#!/bin/bash

# AWS Lambda Deployment Script for Bedrock Historical Analysis

set -e

# Configuration
FUNCTION_NAME="bedrock-historical-analysis"
REGION="ap-northeast-2"
RUNTIME="python3.11"
HANDLER="bedrock_historical_analysis.lambda_handler"
TIMEOUT=300
MEMORY_SIZE=512

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Starting Lambda deployment for ${FUNCTION_NAME}${NC}"

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI is not installed. Please install it first.${NC}"
    exit 1
fi

# Check if zip is installed
if ! command -v zip &> /dev/null; then
    echo -e "${RED}❌ zip is not installed. Please install it first.${NC}"
    exit 1
fi

# Create deployment package
echo -e "${YELLOW}📦 Creating deployment package...${NC}"

# Create temporary directory
TEMP_DIR=$(mktemp -d)
echo "Using temporary directory: $TEMP_DIR"

# Copy function code
cp bedrock_historical_analysis.py $TEMP_DIR/
cp requirements.txt $TEMP_DIR/

# Install dependencies
echo -e "${YELLOW}📥 Installing dependencies...${NC}"
cd $TEMP_DIR
pip install -r requirements.txt -t .

# Create deployment zip
echo -e "${YELLOW}🗜️ Creating deployment zip...${NC}"
zip -r ../lambda-deployment.zip . -x "*.pyc" "*__pycache__*"

# Go back to original directory
cd - > /dev/null

# Check if function exists
echo -e "${YELLOW}🔍 Checking if Lambda function exists...${NC}"
if aws lambda get-function --function-name $FUNCTION_NAME --region $REGION &> /dev/null; then
    echo -e "${GREEN}✅ Function exists. Updating code...${NC}"
    
    # Update function code
    aws lambda update-function-code \
        --function-name $FUNCTION_NAME \
        --zip-file fileb://$TEMP_DIR/../lambda-deployment.zip \
        --region $REGION
    
    echo -e "${GREEN}✅ Function code updated successfully!${NC}"
else
    echo -e "${YELLOW}⚠️ Function doesn't exist. Creating new function...${NC}"
    
    # Create IAM role for Lambda (if it doesn't exist)
    ROLE_NAME="bedrock-lambda-execution-role"
    ROLE_ARN="arn:aws:iam::$(aws sts get-caller-identity --query Account --output text):role/$ROLE_NAME"
    
    if ! aws iam get-role --role-name $ROLE_NAME &> /dev/null; then
        echo -e "${YELLOW}🔐 Creating IAM role...${NC}"
        
        # Create trust policy
        cat > /tmp/trust-policy.json << EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Principal": {
                "Service": "lambda.amazonaws.com"
            },
            "Action": "sts:AssumeRole"
        }
    ]
}
EOF
        
        # Create role
        aws iam create-role \
            --role-name $ROLE_NAME \
            --assume-role-policy-document file:///tmp/trust-policy.json
        
        # Attach basic execution policy
        aws iam attach-role-policy \
            --role-name $ROLE_NAME \
            --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole
        
        # Create and attach custom policy for Bedrock, S3, and Rekognition
        cat > /tmp/lambda-policy.json << EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "bedrock:InvokeModel",
                "bedrock:InvokeModelWithResponseStream"
            ],
            "Resource": "*"
        },
        {
            "Effect": "Allow",
            "Action": [
                "s3:GetObject",
                "s3:PutObject"
            ],
            "Resource": "arn:aws:s3:::*/*"
        },
        {
            "Effect": "Allow",
            "Action": [
                "rekognition:DetectLabels",
                "rekognition:DetectText"
            ],
            "Resource": "*"
        },
        {
            "Effect": "Allow",
            "Action": [
                "sqs:ReceiveMessage",
                "sqs:DeleteMessage",
                "sqs:GetQueueAttributes"
            ],
            "Resource": "*"
        }
    ]
}
EOF
        
        aws iam put-role-policy \
            --role-name $ROLE_NAME \
            --policy-name BedrockLambdaPolicy \
            --policy-document file:///tmp/lambda-policy.json
        
        echo -e "${GREEN}✅ IAM role created successfully!${NC}"
        
        # Wait for role to be available
        echo -e "${YELLOW}⏳ Waiting for IAM role to be available...${NC}"
        sleep 10
    fi
    
    # Create Lambda function
    aws lambda create-function \
        --function-name $FUNCTION_NAME \
        --runtime $RUNTIME \
        --role $ROLE_ARN \
        --handler $HANDLER \
        --zip-file fileb://$TEMP_DIR/../lambda-deployment.zip \
        --timeout $TIMEOUT \
        --memory-size $MEMORY_SIZE \
        --region $REGION \
        --description "Historical analysis using Amazon Bedrock and Rekognition"
    
    echo -e "${GREEN}✅ Lambda function created successfully!${NC}"
fi

# Update function configuration
echo -e "${YELLOW}⚙️ Updating function configuration...${NC}"
aws lambda update-function-configuration \
    --function-name $FUNCTION_NAME \
    --timeout $TIMEOUT \
    --memory-size $MEMORY_SIZE \
    --region $REGION

# Clean up
echo -e "${YELLOW}🧹 Cleaning up temporary files...${NC}"
rm -rf $TEMP_DIR
rm -f $TEMP_DIR/../lambda-deployment.zip
rm -f /tmp/trust-policy.json /tmp/lambda-policy.json

echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
echo -e "${GREEN}Function Name: ${FUNCTION_NAME}${NC}"
echo -e "${GREEN}Region: ${REGION}${NC}"
echo -e "${GREEN}Runtime: ${RUNTIME}${NC}"

# Test the function (optional)
read -p "Do you want to test the function with a sample event? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}🧪 Testing function...${NC}"
    
    # Create test event
    cat > /tmp/test-event.json << EOF
{
    "Records": [
        {
            "body": "{\"s3_bucket\":\"test-bucket\",\"s3_key\":\"test-image.jpg\",\"gps_data\":{\"latitude\":37.5759,\"longitude\":126.9769},\"place_info\":{\"place_name\":\"경복궁\",\"address\":\"서울특별시 종로구 사직로 161\",\"category\":\"관광명소\"},\"request_id\":\"test-123\"}"
        }
    ]
}
EOF
    
    aws lambda invoke \
        --function-name $FUNCTION_NAME \
        --payload file:///tmp/test-event.json \
        --region $REGION \
        /tmp/response.json
    
    echo -e "${GREEN}Test response:${NC}"
    cat /tmp/response.json
    echo
    
    # Clean up test files
    rm -f /tmp/test-event.json /tmp/response.json
fi

echo -e "${GREEN}✨ All done! Your Lambda function is ready to process historical analysis requests.${NC}"

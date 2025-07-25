import json
import boto3
import logging
from typing import Dict, Any
import base64
from datetime import datetime

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize AWS clients
bedrock_runtime = boto3.client('bedrock-runtime', region_name='us-east-1')
s3_client = boto3.client('s3')
rekognition_client = boto3.client('rekognition')

def lambda_handler(event, context):
    """
    Lambda function to process image analysis and generate historical descriptions
    using Amazon Bedrock
    """
    try:
        # Parse SQS message
        for record in event['Records']:
            message_body = json.loads(record['body'])
            
            # Extract data from message
            s3_bucket = message_body['s3_bucket']
            s3_key = message_body['s3_key']
            gps_data = message_body['gps_data']
            place_info = message_body['place_info']
            request_id = message_body['request_id']
            
            logger.info(f"Processing request {request_id} for {place_info.get('place_name', 'Unknown location')}")
            
            # Step 1: Analyze image with Rekognition
            building_analysis = analyze_building_with_rekognition(s3_bucket, s3_key)
            
            # Step 2: Generate historical description with Bedrock
            historical_description = generate_historical_description(
                place_info, gps_data, building_analysis
            )
            
            # Step 3: Store results back to S3 or send to another queue
            result = {
                'request_id': request_id,
                'place_info': place_info,
                'building_analysis': building_analysis,
                'historical_description': historical_description,
                'processed_at': datetime.utcnow().isoformat(),
                'status': 'COMPLETED'
            }
            
            # Store result in S3
            store_analysis_result(s3_bucket, request_id, result)
            
            logger.info(f"Successfully processed request {request_id}")
            
        return {
            'statusCode': 200,
            'body': json.dumps({'message': 'Successfully processed all messages'})
        }
        
    except Exception as e:
        logger.error(f"Error processing Lambda function: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }

def analyze_building_with_rekognition(s3_bucket: str, s3_key: str) -> Dict[str, Any]:
    """
    Use AWS Rekognition to analyze building features in the image
    """
    try:
        # Detect labels (buildings, architecture, etc.)
        labels_response = rekognition_client.detect_labels(
            Image={'S3Object': {'Bucket': s3_bucket, 'Name': s3_key}},
            MaxLabels=20,
            MinConfidence=70
        )
        
        # Detect text in image (signs, plaques, etc.)
        text_response = rekognition_client.detect_text(
            Image={'S3Object': {'Bucket': s3_bucket, 'Name': s3_key}}
        )
        
        # Extract relevant building/architecture labels
        building_labels = []
        for label in labels_response['Labels']:
            if any(keyword in label['Name'].lower() for keyword in 
                   ['building', 'architecture', 'temple', 'palace', 'monument', 'structure']):
                building_labels.append({
                    'name': label['Name'],
                    'confidence': label['Confidence']
                })
        
        # Extract detected text
        detected_text = []
        for text_detection in text_response['TextDetections']:
            if text_detection['Type'] == 'LINE':
                detected_text.append({
                    'text': text_detection['DetectedText'],
                    'confidence': text_detection['Confidence']
                })
        
        return {
            'building_labels': building_labels,
            'detected_text': detected_text,
            'analysis_timestamp': datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error in Rekognition analysis: {str(e)}")
        return {'error': str(e)}

def generate_historical_description(place_info: Dict, gps_data: Dict, building_analysis: Dict) -> str:
    """
    Generate historical and philosophical description using Amazon Bedrock
    """
    try:
        # Prepare context for Bedrock
        place_name = place_info.get('place_name', 'Unknown location')
        address = place_info.get('address', 'Unknown address')
        category = place_info.get('category', 'Unknown category')
        
        # Extract building features from Rekognition
        building_features = []
        if 'building_labels' in building_analysis:
            building_features = [label['name'] for label in building_analysis['building_labels']]
        
        detected_text = []
        if 'detected_text' in building_analysis:
            detected_text = [text['text'] for text in building_analysis['detected_text']]
        
        # Create comprehensive prompt for Bedrock
        prompt = f"""
Human: I'm looking at a photograph of {place_name} located at {address}. 

Location Details:
- Name: {place_name}
- Address: {address}
- Category: {category}
- GPS Coordinates: {gps_data.get('latitude', 'N/A')}, {gps_data.get('longitude', 'N/A')}

Image Analysis Results:
- Detected architectural features: {', '.join(building_features) if building_features else 'None detected'}
- Text found in image: {', '.join(detected_text) if detected_text else 'None detected'}

Please provide a comprehensive historical and philosophical description of this location that includes:

1. **Historical Significance**: Key historical events, periods, and importance
2. **Architectural Features**: Description of architectural style, design elements, and cultural influences
3. **Cultural Context**: Role in Korean culture, traditions, and society
4. **Philosophical Meaning**: Deeper meaning, symbolism, and philosophical concepts associated with this place
5. **Interesting Facts**: Lesser-known facts or stories about this location

Please write in an engaging, educational tone suitable for tourists and history enthusiasts. Keep the response between 300-500 words.
        # Call Amazon Bedrock with Claude
        response = bedrock_runtime.invoke_model(
            modelId='anthropic.claude-3-sonnet-20240229-v1:0',
            body=json.dumps({
                'anthropic_version': 'bedrock-2023-05-31',
                'max_tokens': 1000,
                'messages': [
                    {
                        'role': 'user',
                        'content': prompt
                    }
                ]
            })
        )
        
        # Parse Bedrock response
        response_body = json.loads(response['body'].read())
        historical_description = response_body['content'][0]['text']
        
        return historical_description
        
    except Exception as e:
        logger.error(f"Error generating historical description: {str(e)}")
        return f"Unable to generate historical description: {str(e)}"

def store_analysis_result(s3_bucket: str, request_id: str, result: Dict[str, Any]):
    """
    Store the analysis result back to S3 for the FastAPI backend to retrieve
    """
    try:
        result_key = f"analysis-results/{request_id}.json"
        
        s3_client.put_object(
            Bucket=s3_bucket,
            Key=result_key,
            Body=json.dumps(result, ensure_ascii=False, indent=2),
            ContentType='application/json'
        )
        
        logger.info(f"Stored analysis result for {request_id} at s3://{s3_bucket}/{result_key}")
        
    except Exception as e:
        logger.error(f"Error storing analysis result: {str(e)}")
        raise e

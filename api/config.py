import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    # AWS Configuration
    AWS_REGION = os.getenv("AWS_REGION", "ap-northeast-2")
    AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID")
    AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")
    S3_BUCKET_NAME = os.getenv("S3_BUCKET_NAME")
    SQS_QUEUE_URL = os.getenv("SQS_QUEUE_URL")
    
    # Naver Maps API (primary location service)
    NAVER_CLIENT_ID = os.getenv("NAVER_CLIENT_ID")
    NAVER_CLIENT_SECRET = os.getenv("NAVER_CLIENT_SECRET")
    
    # Cultural Property API (Korean Cultural Heritage Administration)
    CULTURAL_PROPERTY_API_KEY = os.getenv("CULTURAL_PROPERTY_API_KEY")
    
    # Note: OpenRestroom API doesn't require API key - it's open source
    # But we keep this for potential future authentication
    OPENRESTROOM_API_KEY = os.getenv("OPENRESTROOM_API_KEY", "")
    
    # Authentication Settings
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-super-secret-jwt-key-change-in-production")
    JWT_ALGORITHM = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES = 30
    
    # OAuth Provider Settings
    KAKAO_REST_API_KEY = os.getenv("KAKAO_REST_API_KEY")
    KAKAO_REDIRECT_URI = os.getenv("KAKAO_REDIRECT_URI", "http://localhost:8000/auth/kakao/callback")
    
    GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
    GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
    GOOGLE_REDIRECT_URI = os.getenv("GOOGLE_REDIRECT_URI", "http://localhost:8000/auth/google/callback")
    
    APPLE_CLIENT_ID = os.getenv("APPLE_CLIENT_ID")
    APPLE_TEAM_ID = os.getenv("APPLE_TEAM_ID")
    APPLE_KEY_ID = os.getenv("APPLE_KEY_ID")
    APPLE_PRIVATE_KEY = os.getenv("APPLE_PRIVATE_KEY")
    
    # Application Settings
    DEBUG = os.getenv("DEBUG", "False").lower() == "true"
    MAX_FILE_SIZE = int(os.getenv("MAX_FILE_SIZE", "10485760"))  # 10MB
    ALLOWED_IMAGE_TYPES = os.getenv("ALLOWED_IMAGE_TYPES", "image/jpeg,image/png,image/webp").split(",")
    
    # API Settings
    API_V1_PREFIX = "/api/v1"
    PROJECT_NAME = "Historical Place Recognition API"
    VERSION = "1.0.0"

settings = Settings()

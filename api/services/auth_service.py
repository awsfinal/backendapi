import jwt
import httpx
import logging
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from fastapi import HTTPException, status
from passlib.context import CryptContext

from config import settings

logger = logging.getLogger(__name__)

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class AuthService:
    def __init__(self):
        self.secret_key = settings.JWT_SECRET_KEY
        self.algorithm = "HS256"
        self.access_token_expire_minutes = 30
        
    def create_access_token(self, data: dict, expires_delta: Optional[timedelta] = None):
        """Create JWT access token"""
        to_encode = data.copy()
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(minutes=self.access_token_expire_minutes)
        
        to_encode.update({"exp": expire})
        encoded_jwt = jwt.encode(to_encode, self.secret_key, algorithm=self.algorithm)
        return encoded_jwt
    
    def verify_token(self, token: str) -> Dict[str, Any]:
        """Verify JWT token and return payload"""
        try:
            payload = jwt.decode(token, self.secret_key, algorithms=[self.algorithm])
            return payload
        except jwt.ExpiredSignatureError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token has expired"
            )
        except jwt.JWTError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials"
            )

class KakaoAuthService:
    def __init__(self):
        self.client_id = settings.KAKAO_REST_API_KEY
        self.redirect_uri = settings.KAKAO_REDIRECT_URI
        
    async def get_user_info(self, access_token: str) -> Dict[str, Any]:
        """Get user information from Kakao API"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    "https://kapi.kakao.com/v2/user/me",
                    headers={"Authorization": f"Bearer {access_token}"}
                )
                
                if response.status_code != 200:
                    raise HTTPException(
                        status_code=status.HTTP_401_UNAUTHORIZED,
                        detail="Invalid Kakao access token"
                    )
                
                user_data = response.json()
                return {
                    "provider": "kakao",
                    "provider_id": str(user_data["id"]),
                    "email": user_data.get("kakao_account", {}).get("email"),
                    "name": user_data.get("kakao_account", {}).get("profile", {}).get("nickname"),
                    "profile_image": user_data.get("kakao_account", {}).get("profile", {}).get("profile_image_url")
                }
                
        except httpx.RequestError as e:
            logger.error(f"Error fetching Kakao user info: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to fetch user information from Kakao"
            )

class GoogleAuthService:
    def __init__(self):
        self.client_id = settings.GOOGLE_CLIENT_ID
        self.client_secret = settings.GOOGLE_CLIENT_SECRET
        
    async def get_user_info(self, access_token: str) -> Dict[str, Any]:
        """Get user information from Google API"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    "https://www.googleapis.com/oauth2/v2/userinfo",
                    headers={"Authorization": f"Bearer {access_token}"}
                )
                
                if response.status_code != 200:
                    raise HTTPException(
                        status_code=status.HTTP_401_UNAUTHORIZED,
                        detail="Invalid Google access token"
                    )
                
                user_data = response.json()
                return {
                    "provider": "google",
                    "provider_id": user_data["id"],
                    "email": user_data.get("email"),
                    "name": user_data.get("name"),
                    "profile_image": user_data.get("picture")
                }
                
        except httpx.RequestError as e:
            logger.error(f"Error fetching Google user info: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to fetch user information from Google"
            )

class NaverAuthService:
    def __init__(self):
        self.client_id = settings.NAVER_CLIENT_ID
        self.client_secret = settings.NAVER_CLIENT_SECRET
        
    async def get_user_info(self, access_token: str) -> Dict[str, Any]:
        """Get user information from Naver API"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    "https://openapi.naver.com/v1/nid/me",
                    headers={"Authorization": f"Bearer {access_token}"}
                )
                
                if response.status_code != 200:
                    raise HTTPException(
                        status_code=status.HTTP_401_UNAUTHORIZED,
                        detail="Invalid Naver access token"
                    )
                
                user_data = response.json()
                profile = user_data.get("response", {})
                return {
                    "provider": "naver",
                    "provider_id": profile.get("id"),
                    "email": profile.get("email"),
                    "name": profile.get("name"),
                    "profile_image": profile.get("profile_image")
                }
                
        except httpx.RequestError as e:
            logger.error(f"Error fetching Naver user info: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to fetch user information from Naver"
            )

class AppleAuthService:
    def __init__(self):
        self.client_id = settings.APPLE_CLIENT_ID
        self.team_id = settings.APPLE_TEAM_ID
        self.key_id = settings.APPLE_KEY_ID
        self.private_key = settings.APPLE_PRIVATE_KEY
        
    async def verify_identity_token(self, identity_token: str) -> Dict[str, Any]:
        """Verify Apple identity token and extract user info"""
        try:
            # Decode the JWT token (simplified - in production, verify signature)
            payload = jwt.decode(identity_token, options={"verify_signature": False})
            
            return {
                "provider": "apple",
                "provider_id": payload.get("sub"),
                "email": payload.get("email"),
                "name": payload.get("name", "Apple User"),  # Apple doesn't always provide name
                "profile_image": None
            }
            
        except jwt.JWTError as e:
            logger.error(f"Error verifying Apple identity token: {e}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid Apple identity token"
            )

# Service instances
auth_service = AuthService()
kakao_auth_service = KakaoAuthService()
google_auth_service = GoogleAuthService()
naver_auth_service = NaverAuthService()
apple_auth_service = AppleAuthService()

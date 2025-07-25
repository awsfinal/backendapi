from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Dict, Any
import logging

from models import LoginRequest, LoginResponse, User, UserCreate, AuthProvider
from services.auth_service import (
    auth_service, kakao_auth_service, google_auth_service, 
    naver_auth_service, apple_auth_service
)
from services.user_service import user_service

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/auth", tags=["Authentication"])
security = HTTPBearer()

@router.post("/login", response_model=LoginResponse)
async def login(login_request: LoginRequest):
    """
    Multi-provider OAuth login endpoint
    Supports Kakao, Google, Naver, and Apple Sign In
    """
    try:
        user_info = None
        
        # Get user info from respective provider
        if login_request.provider == AuthProvider.KAKAO:
            user_info = await kakao_auth_service.get_user_info(login_request.access_token)
            
        elif login_request.provider == AuthProvider.GOOGLE:
            user_info = await google_auth_service.get_user_info(login_request.access_token)
            
        elif login_request.provider == AuthProvider.NAVER:
            user_info = await naver_auth_service.get_user_info(login_request.access_token)
            
        elif login_request.provider == AuthProvider.APPLE:
            if not login_request.identity_token:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Identity token required for Apple Sign In"
                )
            user_info = await apple_auth_service.verify_identity_token(login_request.identity_token)
        
        if not user_info:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Unsupported authentication provider"
            )
        
        # Find or create user
        user = await user_service.find_or_create_user(UserCreate(**user_info))
        
        # Update last login
        await user_service.update_last_login(user.id)
        
        # Generate JWT token
        token_data = {
            "user_id": user.id,
            "provider": user.provider.value,
            "email": user.email
        }
        access_token = auth_service.create_access_token(token_data)
        
        return LoginResponse(
            access_token=access_token,
            user=user
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Authentication failed"
        )

@router.post("/logout")
async def logout(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """
    Logout endpoint - invalidate token
    In a production system, you'd want to maintain a token blacklist
    """
    try:
        # Verify token is valid
        payload = auth_service.verify_token(credentials.credentials)
        
        # In production, add token to blacklist here
        # await token_blacklist_service.add_token(credentials.credentials)
        
        return {"message": "Successfully logged out"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Logout error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Logout failed"
        )

@router.get("/me", response_model=User)
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """
    Get current authenticated user information
    """
    try:
        # Verify and decode token
        payload = auth_service.verify_token(credentials.credentials)
        user_id = payload.get("user_id")
        
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token payload"
            )
        
        # Get user from database
        user = await user_service.get_user_by_id(user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        return user
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get current user error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get user information"
        )

@router.delete("/account")
async def delete_account(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """
    Delete user account and all associated data
    """
    try:
        # Verify token
        payload = auth_service.verify_token(credentials.credentials)
        user_id = payload.get("user_id")
        
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token payload"
            )
        
        # Delete user and all associated data
        await user_service.delete_user(user_id)
        
        return {"message": "Account successfully deleted"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Delete account error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete account"
        )

# Dependency to get current user for protected endpoints
async def get_current_user_dependency(credentials: HTTPAuthorizationCredentials = Depends(security)) -> User:
    """
    Dependency to get current authenticated user for protected endpoints
    """
    payload = auth_service.verify_token(credentials.credentials)
    user_id = payload.get("user_id")
    
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload"
        )
    
    user = await user_service.get_user_by_id(user_id)
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive"
        )
    
    return user

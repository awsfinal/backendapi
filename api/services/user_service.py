import logging
from datetime import datetime
from typing import Optional, List
import uuid

from models import User, UserCreate, AuthProvider

logger = logging.getLogger(__name__)

class UserService:
    def __init__(self):
        # In-memory storage for development
        # In production, replace with actual database (PostgreSQL, DynamoDB, etc.)
        self.users: dict[str, User] = {}
        self.users_by_provider: dict[str, dict[str, User]] = {
            "kakao": {},
            "google": {},
            "naver": {},
            "apple": {}
        }
    
    async def find_or_create_user(self, user_create: UserCreate) -> User:
        """
        Find existing user by provider and provider_id, or create new user
        """
        try:
            # Check if user already exists
            provider_key = f"{user_create.provider.value}:{user_create.provider_id}"
            existing_user = self.users_by_provider[user_create.provider.value].get(user_create.provider_id)
            
            if existing_user:
                # Update user info if changed
                existing_user.email = user_create.email or existing_user.email
                existing_user.name = user_create.name or existing_user.name
                existing_user.profile_image = user_create.profile_image or existing_user.profile_image
                existing_user.last_login = datetime.utcnow()
                
                logger.info(f"Updated existing user: {existing_user.id}")
                return existing_user
            
            # Create new user
            new_user = User(
                id=str(uuid.uuid4()),
                provider=user_create.provider,
                provider_id=user_create.provider_id,
                email=user_create.email,
                name=user_create.name,
                profile_image=user_create.profile_image,
                created_at=datetime.utcnow(),
                last_login=datetime.utcnow(),
                is_active=True
            )
            
            # Store user
            self.users[new_user.id] = new_user
            self.users_by_provider[user_create.provider.value][user_create.provider_id] = new_user
            
            logger.info(f"Created new user: {new_user.id} via {user_create.provider.value}")
            return new_user
            
        except Exception as e:
            logger.error(f"Error in find_or_create_user: {str(e)}")
            raise e
    
    async def get_user_by_id(self, user_id: str) -> Optional[User]:
        """
        Get user by ID
        """
        return self.users.get(user_id)
    
    async def get_user_by_provider(self, provider: AuthProvider, provider_id: str) -> Optional[User]:
        """
        Get user by provider and provider ID
        """
        return self.users_by_provider[provider.value].get(provider_id)
    
    async def update_last_login(self, user_id: str) -> bool:
        """
        Update user's last login timestamp
        """
        try:
            user = self.users.get(user_id)
            if user:
                user.last_login = datetime.utcnow()
                return True
            return False
        except Exception as e:
            logger.error(f"Error updating last login for user {user_id}: {str(e)}")
            return False
    
    async def update_user_profile(self, user_id: str, name: Optional[str] = None, 
                                 profile_image: Optional[str] = None) -> Optional[User]:
        """
        Update user profile information
        """
        try:
            user = self.users.get(user_id)
            if user:
                if name:
                    user.name = name
                if profile_image:
                    user.profile_image = profile_image
                
                logger.info(f"Updated profile for user: {user_id}")
                return user
            return None
        except Exception as e:
            logger.error(f"Error updating user profile {user_id}: {str(e)}")
            return None
    
    async def deactivate_user(self, user_id: str) -> bool:
        """
        Deactivate user account
        """
        try:
            user = self.users.get(user_id)
            if user:
                user.is_active = False
                logger.info(f"Deactivated user: {user_id}")
                return True
            return False
        except Exception as e:
            logger.error(f"Error deactivating user {user_id}: {str(e)}")
            return False
    
    async def delete_user(self, user_id: str) -> bool:
        """
        Delete user and all associated data
        """
        try:
            user = self.users.get(user_id)
            if user:
                # Remove from main storage
                del self.users[user_id]
                
                # Remove from provider storage
                provider_users = self.users_by_provider[user.provider.value]
                if user.provider_id in provider_users:
                    del provider_users[user.provider_id]
                
                # In production, also delete:
                # - User's photo analysis history
                # - User's saved places
                # - Any other user-associated data
                
                logger.info(f"Deleted user: {user_id}")
                return True
            return False
        except Exception as e:
            logger.error(f"Error deleting user {user_id}: {str(e)}")
            return False
    
    async def get_user_stats(self, user_id: str) -> dict:
        """
        Get user statistics (for analytics/admin purposes)
        """
        try:
            user = self.users.get(user_id)
            if not user:
                return {}
            
            # In production, calculate from actual data
            return {
                "user_id": user_id,
                "provider": user.provider.value,
                "created_at": user.created_at,
                "last_login": user.last_login,
                "is_active": user.is_active,
                "total_photos_analyzed": 0,  # Calculate from photo analysis history
                "favorite_places_count": 0,  # Calculate from saved places
            }
        except Exception as e:
            logger.error(f"Error getting user stats {user_id}: {str(e)}")
            return {}
    
    async def list_users(self, limit: int = 100, offset: int = 0) -> List[User]:
        """
        List users (for admin purposes)
        """
        try:
            all_users = list(self.users.values())
            return all_users[offset:offset + limit]
        except Exception as e:
            logger.error(f"Error listing users: {str(e)}")
            return []

# Service instance
user_service = UserService()

from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import List, Dict, Any, Optional
import logging

from models import User
from services.public_facility_service import public_facility_service
from services.heritage_service import heritage_service
from auth_endpoints import get_current_user_dependency

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/location", tags=["Location Services"])
security = HTTPBearer()

@router.get("/nearby-restrooms")
async def get_nearby_restrooms(
    latitude: float = Query(..., description="위도", ge=-90, le=90),
    longitude: float = Query(..., description="경도", ge=-180, le=180),
    radius: int = Query(1000, description="검색 반경 (미터)", ge=100, le=5000),
    current_user: User = Depends(get_current_user_dependency)
):
    """
    현재 위치 주변의 공중화장실 정보를 조회합니다.
    
    - **latitude**: 현재 위치의 위도
    - **longitude**: 현재 위치의 경도  
    - **radius**: 검색 반경 (미터, 기본값: 1000m)
    """
    try:
        restrooms = await public_facility_service.get_nearby_restrooms(
            latitude, longitude, radius
        )
        
        return {
            "status": "success",
            "data": {
                "restrooms": restrooms,
                "total_count": len(restrooms),
                "search_radius": radius,
                "user_location": {
                    "latitude": latitude,
                    "longitude": longitude
                }
            },
            "message": f"Found {len(restrooms)} restrooms within {radius}m"
        }
        
    except Exception as e:
        logger.error(f"Error getting nearby restrooms: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve nearby restrooms"
        )

@router.get("/heritage-recommendations")
async def get_heritage_recommendations(
    latitude: float = Query(..., description="위도", ge=-90, le=90),
    longitude: float = Query(..., description="경도", ge=-180, le=180),
    radius: int = Query(5000, description="검색 반경 (미터)", ge=500, le=20000),
    categories: Optional[str] = Query(None, description="관심 문화재 유형 (쉼표로 구분)"),
    accessibility: bool = Query(False, description="휠체어 접근성 필요 여부"),
    current_user: User = Depends(get_current_user_dependency)
):
    """
    현재 위치 주변의 문화유산 추천 정보를 조회합니다.
    
    - **latitude**: 현재 위치의 위도
    - **longitude**: 현재 위치의 경도
    - **radius**: 검색 반경 (미터, 기본값: 5000m)
    - **categories**: 관심 문화재 유형 (예: "국보,보물,사적")
    - **accessibility**: 휠체어 접근성 필요 여부
    """
    try:
        # Parse user preferences
        preferences = {}
        
        if categories:
            preferences['heritage_categories'] = [cat.strip() for cat in categories.split(',')]
        
        if accessibility:
            preferences['wheelchair_accessible'] = True
        
        # Get heritage recommendations
        recommendations = await heritage_service.get_heritage_recommendations(
            latitude, longitude, radius, current_user, preferences
        )
        
        # Group by category for better presentation
        categorized_recommendations = {}
        for site in recommendations:
            category = site.get('category', '기타')
            if category not in categorized_recommendations:
                categorized_recommendations[category] = []
            categorized_recommendations[category].append(site)
        
        return {
            "status": "success",
            "data": {
                "recommendations": recommendations,
                "categorized": categorized_recommendations,
                "total_count": len(recommendations),
                "search_radius": radius,
                "user_location": {
                    "latitude": latitude,
                    "longitude": longitude
                },
                "applied_preferences": preferences
            },
            "message": f"Found {len(recommendations)} heritage sites within {radius}m"
        }
        
    except Exception as e:
        logger.error(f"Error getting heritage recommendations: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve heritage recommendations"
        )

@router.get("/heritage/{heritage_id}")
async def get_heritage_details(
    heritage_id: str,
    current_user: User = Depends(get_current_user_dependency)
):
    """
    특정 문화유산의 상세 정보를 조회합니다.
    
    - **heritage_id**: 문화유산 ID (예: "cha_12345" 또는 "kto_67890")
    """
    try:
        heritage_details = await heritage_service.get_heritage_details(heritage_id)
        
        if not heritage_details:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Heritage site not found"
            )
        
        return {
            "status": "success",
            "data": heritage_details,
            "message": "Heritage details retrieved successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting heritage details for {heritage_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve heritage details"
        )

@router.get("/search")
async def search_locations(
    query: str = Query(..., description="검색어", min_length=2),
    latitude: float = Query(..., description="현재 위치 위도"),
    longitude: float = Query(..., description="현재 위치 경도"),
    radius: int = Query(10000, description="검색 반경 (미터)", ge=1000, le=50000),
    type: str = Query("all", description="검색 유형: all, heritage, restroom"),
    current_user: User = Depends(get_current_user_dependency)
):
    """
    키워드로 주변 장소를 검색합니다.
    
    - **query**: 검색할 키워드
    - **latitude**: 현재 위치의 위도
    - **longitude**: 현재 위치의 경도
    - **radius**: 검색 반경 (미터)
    - **type**: 검색 유형 (all, heritage, restroom)
    """
    try:
        results = {
            "heritage_sites": [],
            "restrooms": []
        }
        
        if type in ["all", "heritage"]:
            # Search heritage sites
            heritage_recommendations = await heritage_service.get_heritage_recommendations(
                latitude, longitude, radius, current_user
            )
            
            # Filter by query
            filtered_heritage = [
                site for site in heritage_recommendations
                if query.lower() in site.get('name', '').lower() or 
                   query.lower() in site.get('description', '').lower() or
                   query.lower() in site.get('address', '').lower()
            ]
            
            results["heritage_sites"] = filtered_heritage[:10]
        
        if type in ["all", "restroom"]:
            # Search restrooms
            restrooms = await public_facility_service.get_nearby_restrooms(
                latitude, longitude, radius
            )
            
            # Filter by query
            filtered_restrooms = [
                restroom for restroom in restrooms
                if query.lower() in restroom.get('name', '').lower() or
                   query.lower() in restroom.get('address', '').lower()
            ]
            
            results["restrooms"] = filtered_restrooms[:10]
        
        total_results = len(results["heritage_sites"]) + len(results["restrooms"])
        
        return {
            "status": "success",
            "data": {
                "results": results,
                "total_count": total_results,
                "query": query,
                "search_type": type,
                "search_radius": radius
            },
            "message": f"Found {total_results} results for '{query}'"
        }
        
    except Exception as e:
        logger.error(f"Error searching locations with query '{query}': {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to search locations"
        )

@router.post("/save-favorite")
async def save_favorite_location(
    location_data: Dict[str, Any],
    current_user: User = Depends(get_current_user_dependency)
):
    """
    사용자가 관심 있는 장소를 즐겨찾기에 저장합니다.
    """
    try:
        # In production, save to database
        # For now, we'll just return success
        
        # Validate required fields
        required_fields = ['id', 'name', 'latitude', 'longitude', 'type']
        for field in required_fields:
            if field not in location_data:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Missing required field: {field}"
                )
        
        # Here you would save to database:
        # await user_service.save_favorite_location(current_user.id, location_data)
        
        return {
            "status": "success",
            "message": "Location saved to favorites",
            "data": {
                "location_id": location_data['id'],
                "user_id": current_user.id
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error saving favorite location: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to save favorite location"
        )

@router.get("/favorites")
async def get_favorite_locations(
    current_user: User = Depends(get_current_user_dependency)
):
    """
    사용자의 즐겨찾기 장소 목록을 조회합니다.
    """
    try:
        # In production, retrieve from database
        # For now, return empty list
        
        # favorites = await user_service.get_favorite_locations(current_user.id)
        favorites = []
        
        return {
            "status": "success",
            "data": {
                "favorites": favorites,
                "total_count": len(favorites)
            },
            "message": "Favorite locations retrieved successfully"
        }
        
    except Exception as e:
        logger.error(f"Error getting favorite locations: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve favorite locations"
        )

@router.post("/geocode")
async def geocode_address(
    address_data: Dict[str, str],
    current_user: User = Depends(get_current_user_dependency)
):
    """
    주소를 좌표로 변환합니다 (Naver Maps Geocoding)
    
    Request body: {"address": "서울시 종로구 사직로 161"}
    """
    try:
        address = address_data.get('address')
        if not address:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Address is required"
            )
        
        # Use heritage service's geocoding method
        coordinates = await heritage_service._geocode_address(address)
        
        if coordinates:
            return {
                "status": "success",
                "data": {
                    "address": address,
                    "coordinates": coordinates
                },
                "message": "Address geocoded successfully"
            }
        else:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Address not found"
            )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error geocoding address: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to geocode address"
        )

@router.post("/reverse-geocode")
async def reverse_geocode_coordinates(
    coordinates_data: Dict[str, float],
    current_user: User = Depends(get_current_user_dependency)
):
    """
    좌표를 주소로 변환합니다 (Naver Maps Reverse Geocoding)
    
    Request body: {"latitude": 37.5759, "longitude": 126.9769}
    """
    try:
        latitude = coordinates_data.get('latitude')
        longitude = coordinates_data.get('longitude')
        
        if latitude is None or longitude is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Both latitude and longitude are required"
            )
        
        # Use public facility service's reverse geocoding method
        korean_address = await public_facility_service._get_korean_address(latitude, longitude)
        
        if korean_address:
            return {
                "status": "success",
                "data": {
                    "coordinates": {
                        "latitude": latitude,
                        "longitude": longitude
                    },
                    "address": korean_address
                },
                "message": "Coordinates reverse geocoded successfully"
            }
        else:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Address not found for coordinates"
            )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error reverse geocoding coordinates: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to reverse geocode coordinates"
        )

@router.get("/search-by-address")
async def search_by_address(
    address: str = Query(..., description="검색할 주소"),
    type: str = Query("all", description="검색 유형: all, heritage, restroom"),
    current_user: User = Depends(get_current_user_dependency)
):
    """
    주소로 주변 시설을 검색합니다
    
    - **address**: 검색할 주소 (예: "서울시 종로구")
    - **type**: 검색 유형 (all, heritage, restroom)
    """
    try:
        results = {
            "heritage_sites": [],
            "restrooms": []
        }
        
        if type in ["all", "restroom"]:
            # Search restrooms by address
            restrooms = await public_facility_service.search_restrooms_by_address(address)
            results["restrooms"] = restrooms[:10]
        
        if type in ["all", "heritage"]:
            # First geocode the address to get coordinates
            coordinates = await heritage_service._geocode_address(address)
            
            if coordinates:
                # Then search for heritage sites nearby
                heritage_sites = await heritage_service.get_heritage_recommendations(
                    coordinates['latitude'], 
                    coordinates['longitude'],
                    radius=10000  # 10km radius for address-based search
                )
                results["heritage_sites"] = heritage_sites[:10]
        
        total_results = len(results["heritage_sites"]) + len(results["restrooms"])
        
        return {
            "status": "success",
            "data": {
                "results": results,
                "total_count": total_results,
                "search_address": address,
                "search_type": type
            },
            "message": f"Found {total_results} results for address '{address}'"
        }
        
    except Exception as e:
        logger.error(f"Error searching by address '{address}': {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to search by address"
        )

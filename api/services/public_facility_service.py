import httpx
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime
import math

from config import settings

logger = logging.getLogger(__name__)

class PublicFacilityService:
    def __init__(self):
        # OpenRestroom API configuration
        self.openrestroom_base_url = "https://www.refugerestrooms.org/api/v1/restrooms"
        
        # Naver Maps API for additional location data
        self.naver_client_id = settings.NAVER_CLIENT_ID
        self.naver_client_secret = settings.NAVER_CLIENT_SECRET
        self.naver_geocoding_url = "https://naveropenapi.apigw.ntruss.com/map-geocode/v2/geocode"
        self.naver_reverse_geocoding_url = "https://naveropenapi.apigw.ntruss.com/map-reversegeocode/v2/gc"
        
    async def get_nearby_restrooms(self, latitude: float, longitude: float, 
                                 radius: int = 1000) -> List[Dict[str, Any]]:
        """
        Get nearby public restrooms using OpenRestroom API and Naver Maps
        """
        try:
            restrooms = []
            
            # Get data from OpenRestroom API
            openrestroom_data = await self._get_openrestroom_data(latitude, longitude)
            
            # Filter by radius and enhance with Naver Maps data
            for restroom in openrestroom_data:
                try:
                    restroom_lat = float(restroom.get('latitude', 0))
                    restroom_lng = float(restroom.get('longitude', 0))
                    
                    # Calculate distance
                    distance = self._calculate_distance(latitude, longitude, restroom_lat, restroom_lng)
                    
                    if distance <= radius:
                        # Enhance with Naver Maps reverse geocoding for Korean address
                        korean_address = await self._get_korean_address(restroom_lat, restroom_lng)
                        
                        enhanced_restroom = {
                            'id': f"openrestroom_{restroom.get('id', '')}",
                            'name': restroom.get('name', '공중화장실'),
                            'address': korean_address or restroom.get('street', ''),
                            'address_en': restroom.get('street', ''),
                            'latitude': restroom_lat,
                            'longitude': restroom_lng,
                            'distance': round(distance),
                            'type': 'public_restroom',
                            'source': 'openrestroom',
                            'facilities': {
                                'wheelchair_accessible': restroom.get('accessible', False),
                                'unisex': restroom.get('unisex', False),
                                'changing_table': restroom.get('changing_table', False)
                            },
                            'details': {
                                'comment': restroom.get('comment', ''),
                                'directions': restroom.get('directions', ''),
                                'approved': restroom.get('approved', False),
                                'created_at': restroom.get('created_at', ''),
                                'updated_at': restroom.get('updated_at', '')
                            }
                        }
                        
                        restrooms.append(enhanced_restroom)
                        
                except (ValueError, TypeError) as e:
                    logger.warning(f"Error processing restroom item: {e}")
                    continue
            
            # Sort by distance and return top results
            sorted_restrooms = sorted(restrooms, key=lambda x: x['distance'])
            return sorted_restrooms[:20]
            
        except Exception as e:
            logger.error(f"Error getting nearby restrooms: {str(e)}")
            return []
    
    async def _get_openrestroom_data(self, lat: float, lng: float) -> List[Dict[str, Any]]:
        """
        Get restroom data from OpenRestroom API
        """
        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                # OpenRestroom API parameters
                params = {
                    'page': 1,
                    'per_page': 100,
                    'offset': 0,
                    'ada': 'true',  # Include ADA accessible restrooms
                    'unisex': 'true'  # Include unisex restrooms
                }
                
                response = await client.get(self.openrestroom_base_url, params=params)
                
                if response.status_code == 200:
                    data = response.json()
                    return data if isinstance(data, list) else []
                else:
                    logger.warning(f"OpenRestroom API returned status {response.status_code}")
                    return []
                    
        except Exception as e:
            logger.error(f"Error fetching OpenRestroom data: {str(e)}")
            return []
    
    async def _get_korean_address(self, lat: float, lng: float) -> Optional[str]:
        """
        Get Korean address using Naver Maps Reverse Geocoding API
        """
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                headers = {
                    'X-NCP-APIGW-API-KEY-ID': self.naver_client_id,
                    'X-NCP-APIGW-API-KEY': self.naver_client_secret
                }
                
                params = {
                    'coords': f"{lng},{lat}",
                    'sourcecrs': 'epsg:4326',
                    'targetcrs': 'epsg:4326',
                    'orders': 'roadaddr,addr'
                }
                
                response = await client.get(
                    self.naver_reverse_geocoding_url, 
                    headers=headers, 
                    params=params
                )
                
                if response.status_code == 200:
                    data = response.json()
                    results = data.get('results', [])
                    
                    if results:
                        # Prefer road address over land address
                        for result in results:
                            if result.get('name') == 'roadaddr':
                                region = result.get('region', {})
                                land = result.get('land', {})
                                
                                # Build Korean address
                                address_parts = []
                                if region.get('area1', {}).get('name'):
                                    address_parts.append(region['area1']['name'])
                                if region.get('area2', {}).get('name'):
                                    address_parts.append(region['area2']['name'])
                                if region.get('area3', {}).get('name'):
                                    address_parts.append(region['area3']['name'])
                                if land.get('name'):
                                    address_parts.append(land['name'])
                                if land.get('number1'):
                                    address_parts.append(land['number1'])
                                
                                return ' '.join(address_parts)
                
                return None
                
        except Exception as e:
            logger.warning(f"Error getting Korean address: {str(e)}")
            return None
    
    async def search_restrooms_by_address(self, address: str) -> List[Dict[str, Any]]:
        """
        Search for restrooms by address using Naver Maps Geocoding
        """
        try:
            # First, geocode the address to get coordinates
            coordinates = await self._geocode_address(address)
            
            if coordinates:
                # Then search for nearby restrooms
                return await self.get_nearby_restrooms(
                    coordinates['latitude'], 
                    coordinates['longitude']
                )
            
            return []
            
        except Exception as e:
            logger.error(f"Error searching restrooms by address: {str(e)}")
            return []
    
    async def _geocode_address(self, address: str) -> Optional[Dict[str, float]]:
        """
        Convert address to coordinates using Naver Maps Geocoding API
        """
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                headers = {
                    'X-NCP-APIGW-API-KEY-ID': self.naver_client_id,
                    'X-NCP-APIGW-API-KEY': self.naver_client_secret
                }
                
                params = {
                    'query': address
                }
                
                response = await client.get(
                    self.naver_geocoding_url,
                    headers=headers,
                    params=params
                )
                
                if response.status_code == 200:
                    data = response.json()
                    addresses = data.get('addresses', [])
                    
                    if addresses:
                        first_result = addresses[0]
                        return {
                            'latitude': float(first_result.get('y', 0)),
                            'longitude': float(first_result.get('x', 0))
                        }
                
                return None
                
        except Exception as e:
            logger.error(f"Error geocoding address: {str(e)}")
            return None
    
    def _calculate_distance(self, lat1: float, lng1: float, lat2: float, lng2: float) -> float:
        """
        Calculate distance between two points using Haversine formula (in meters)
        """
        R = 6371000  # Earth's radius in meters
        
        lat1_rad = math.radians(lat1)
        lat2_rad = math.radians(lat2)
        delta_lat = math.radians(lat2 - lat1)
        delta_lng = math.radians(lng2 - lng1)
        
        a = (math.sin(delta_lat / 2) * math.sin(delta_lat / 2) +
             math.cos(lat1_rad) * math.cos(lat2_rad) *
             math.sin(delta_lng / 2) * math.sin(delta_lng / 2))
        
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        distance = R * c
        
        return distance

# Service instance
public_facility_service = PublicFacilityService()

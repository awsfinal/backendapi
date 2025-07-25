import httpx
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime
import math
import json

from config import settings
from models import User

logger = logging.getLogger(__name__)

class HeritageService:
    def __init__(self):
        # Cultural Property API configuration
        self.cultural_property_api_key = settings.CULTURAL_PROPERTY_API_KEY
        self.cultural_property_base_url = "http://www.cha.go.kr/cha/SearchKindOpenapiList.do"
        
        # Naver Maps API for enhanced location services
        self.naver_client_id = settings.NAVER_CLIENT_ID
        self.naver_client_secret = settings.NAVER_CLIENT_SECRET
        self.naver_geocoding_url = "https://naveropenapi.apigw.ntruss.com/map-geocode/v2/geocode"
        self.naver_reverse_geocoding_url = "https://naveropenapi.apigw.ntruss.com/map-reversegeocode/v2/gc"
        self.naver_search_url = "https://openapi.naver.com/v1/search/local.json"
        
        # Heritage categories with Korean names and priorities
        self.heritage_categories = {
            '국보': {'priority': 10, 'description': '국가지정문화재 중 최고 등급', 'code': '11'},
            '보물': {'priority': 9, 'description': '국가지정문화재 중 중요한 유물', 'code': '12'},
            '사적': {'priority': 8, 'description': '역사적으로 중요한 장소', 'code': '13'},
            '명승': {'priority': 7, 'description': '경치가 아름다운 곳', 'code': '14'},
            '천연기념물': {'priority': 6, 'description': '자연적으로 형성된 귀중한 것', 'code': '15'},
            '중요무형문화재': {'priority': 8, 'description': '전통 기술이나 예능', 'code': '16'},
            '중요민속문화재': {'priority': 7, 'description': '민속적으로 중요한 자료', 'code': '17'},
            '시도유형문화재': {'priority': 5, 'description': '지방자치단체 지정 문화재', 'code': '21'},
            '시도무형문화재': {'priority': 5, 'description': '지방 전통 기술이나 예능', 'code': '22'},
            '문화재자료': {'priority': 4, 'description': '향토문화 보존상 필요한 자료', 'code': '23'}
        }
    
    async def get_heritage_recommendations(self, latitude: float, longitude: float,
                                         radius: int = 5000, user: Optional[User] = None,
                                         preferences: Optional[Dict] = None) -> List[Dict[str, Any]]:
        """
        Get cultural heritage recommendations using Cultural Property API and Naver Maps
        """
        try:
            heritage_sites = []
            
            # Get heritage sites from Cultural Property API
            cultural_sites = await self._get_cultural_property_sites(latitude, longitude, radius)
            heritage_sites.extend(cultural_sites)
            
            # Enhance with Naver Maps local search for additional context
            enhanced_sites = await self._enhance_with_naver_search(heritage_sites, latitude, longitude)
            
            # Remove duplicates
            unique_sites = self._remove_duplicate_sites(enhanced_sites)
            
            # Apply user preferences and scoring
            scored_sites = self._score_heritage_sites(unique_sites, latitude, longitude, user, preferences)
            
            # Sort by recommendation score
            recommended_sites = sorted(scored_sites, key=lambda x: x['recommendation_score'], reverse=True)
            
            return recommended_sites[:15]
            
        except Exception as e:
            logger.error(f"Error getting heritage recommendations: {str(e)}")
            return []
    
    async def _get_cultural_property_sites(self, lat: float, lng: float, radius: int) -> List[Dict[str, Any]]:
        """
        Get heritage sites from Cultural Property API
        """
        try:
            sites = []
            
            async with httpx.AsyncClient(timeout=15.0) as client:
                # Search for different heritage categories
                for category_name, category_info in self.heritage_categories.items():
                    try:
                        params = {
                            'serviceKey': self.cultural_property_api_key,
                            'ccbaCpno': category_info['code'],
                            'pageUnit': 100,
                            'pageIndex': 1,
                            'ccbaCtcd': '',  # All regions
                            'ccbaAsno': '',  # All designation numbers
                            'ccbaCncl': 'N'  # Not cancelled
                        }
                        
                        response = await client.get(self.cultural_property_base_url, params=params)
                        
                        if response.status_code == 200:
                            # Parse XML response
                            sites_data = await self._parse_cultural_property_xml(response.text, category_name)
                            
                            # Filter by distance and enhance with coordinates
                            for site in sites_data:
                                enhanced_site = await self._enhance_site_with_coordinates(site, lat, lng, radius)
                                if enhanced_site:
                                    sites.append(enhanced_site)
                                    
                    except Exception as e:
                        logger.warning(f"Error fetching {category_name} sites: {str(e)}")
                        continue
            
            return sites
            
        except Exception as e:
            logger.error(f"Error fetching Cultural Property sites: {str(e)}")
            return []
    
    async def _parse_cultural_property_xml(self, xml_content: str, category: str) -> List[Dict[str, Any]]:
        """
        Parse XML response from Cultural Property API
        """
        sites = []
        
        try:
            import xml.etree.ElementTree as ET
            
            root = ET.fromstring(xml_content)
            
            for item in root.findall('.//item'):
                try:
                    site_data = {
                        'name': self._get_xml_text(item, 'ccbaMnm1'),
                        'category': category,
                        'address': self._get_xml_text(item, 'ccbaLcad'),
                        'designation_date': self._get_xml_text(item, 'ccbaAsdt'),
                        'heritage_number': self._get_xml_text(item, 'ccbaKdcd'),
                        'content': self._get_xml_text(item, 'content'),
                        'ccba_ctcd': self._get_xml_text(item, 'ccbaCtcd'),
                        'source': 'cultural_property_api'
                    }
                    
                    if site_data['name'] and site_data['address']:
                        sites.append(site_data)
                        
                except Exception as e:
                    logger.warning(f"Error parsing cultural property item: {e}")
                    continue
            
        except Exception as e:
            logger.error(f"Error parsing Cultural Property XML: {str(e)}")
        
        return sites
    
    def _get_xml_text(self, element, tag_name: str) -> str:
        """
        Safely extract text from XML element
        """
        try:
            elem = element.find(tag_name)
            return elem.text if elem is not None and elem.text else ''
        except:
            return ''
    
    async def _enhance_site_with_coordinates(self, site: Dict[str, Any], user_lat: float, 
                                           user_lng: float, radius: int) -> Optional[Dict[str, Any]]:
        """
        Enhance site data with coordinates using Naver Maps Geocoding
        """
        try:
            # Get coordinates for the site address
            coordinates = await self._geocode_address(site['address'])
            
            if coordinates:
                # Calculate distance
                distance = self._calculate_distance(
                    user_lat, user_lng, 
                    coordinates['latitude'], coordinates['longitude']
                )
                
                if distance <= radius:
                    # Enhance site data
                    enhanced_site = {
                        'id': f"cultural_{site['heritage_number']}",
                        'name': site['name'],
                        'category': site['category'],
                        'address': site['address'],
                        'latitude': coordinates['latitude'],
                        'longitude': coordinates['longitude'],
                        'distance': round(distance),
                        'description': site['content'],
                        'designation_date': site['designation_date'],
                        'heritage_number': site['heritage_number'],
                        'source': 'cultural_property_api',
                        'region_code': site['ccba_ctcd']
                    }
                    
                    return enhanced_site
            
            return None
            
        except Exception as e:
            logger.warning(f"Error enhancing site {site.get('name', '')}: {str(e)}")
            return None
    
    async def _enhance_with_naver_search(self, sites: List[Dict[str, Any]], 
                                       lat: float, lng: float) -> List[Dict[str, Any]]:
        """
        Enhance heritage sites with additional information from Naver Local Search
        """
        enhanced_sites = []
        
        for site in sites:
            try:
                # Search for additional information using Naver Local Search
                naver_info = await self._search_naver_local(site['name'], site.get('address', ''))
                
                if naver_info:
                    # Merge information
                    site.update({
                        'phone': naver_info.get('telephone', ''),
                        'category_detail': naver_info.get('category', ''),
                        'road_address': naver_info.get('roadAddress', ''),
                        'naver_link': naver_info.get('link', ''),
                        'naver_description': naver_info.get('description', '')
                    })
                
                enhanced_sites.append(site)
                
            except Exception as e:
                logger.warning(f"Error enhancing site with Naver search: {str(e)}")
                enhanced_sites.append(site)  # Add original site if enhancement fails
        
        return enhanced_sites
    
    async def _search_naver_local(self, query: str, address: str = '') -> Optional[Dict[str, Any]]:
        """
        Search for location information using Naver Local Search API
        """
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                headers = {
                    'X-Naver-Client-Id': self.naver_client_id,
                    'X-Naver-Client-Secret': self.naver_client_secret
                }
                
                # Combine query with address for better results
                search_query = f"{query} {address}".strip()
                
                params = {
                    'query': search_query,
                    'display': 5,
                    'start': 1,
                    'sort': 'random'
                }
                
                response = await client.get(self.naver_search_url, headers=headers, params=params)
                
                if response.status_code == 200:
                    data = response.json()
                    items = data.get('items', [])
                    
                    if items:
                        # Return the first (most relevant) result
                        return items[0]
                
                return None
                
        except Exception as e:
            logger.warning(f"Error searching Naver local: {str(e)}")
            return None
    
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
    
    async def search_heritage_by_name(self, query: str, latitude: float, longitude: float, 
                                    radius: int = 10000) -> List[Dict[str, Any]]:
        """
        Search for heritage sites by name or keyword
        """
        try:
            # Get all heritage recommendations in the area
            all_sites = await self.get_heritage_recommendations(latitude, longitude, radius)
            
            # Filter by query
            filtered_sites = []
            query_lower = query.lower()
            
            for site in all_sites:
                if (query_lower in site.get('name', '').lower() or
                    query_lower in site.get('description', '').lower() or
                    query_lower in site.get('address', '').lower() or
                    query_lower in site.get('category', '').lower()):
                    filtered_sites.append(site)
            
            return filtered_sites[:10]
            
        except Exception as e:
            logger.error(f"Error searching heritage by name: {str(e)}")
            return []
    
    async def _get_kto_detail_info(self, content_id: str) -> Dict[str, Any]:
        """
        Get detailed information for a KTO content item
        """
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                params = {
                    'serviceKey': self.kto_api_key,
                    'contentId': content_id,
                    'MobileOS': 'ETC',
                    'MobileApp': 'HistoricalPlaceApp',
                    '_type': 'json'
                }
                
                # Get common info
                response = await client.get(f"{self.kto_base_url}/detailCommon1", params=params)
                
                if response.status_code == 200:
                    data = response.json()
                    item = data.get('response', {}).get('body', {}).get('items', {}).get('item', [])
                    
                    if isinstance(item, list) and item:
                        return item[0]
                    elif isinstance(item, dict):
                        return item
                
                return {}
                
        except Exception as e:
            logger.warning(f"Error getting KTO detail info for {content_id}: {str(e)}")
            return {}
    
    def _parse_cha_xml_response(self, xml_content: str, category: str) -> List[Dict[str, Any]]:
        """
        Parse XML response from Cultural Heritage Administration API
        """
        # Simplified XML parsing - in production, use proper XML parser like lxml
        sites = []
        
        try:
            # This is a simplified implementation
            # In production, use proper XML parsing with lxml or xml.etree.ElementTree
            import xml.etree.ElementTree as ET
            
            root = ET.fromstring(xml_content)
            
            for item in root.findall('.//item'):
                try:
                    name = item.find('ccbaMnm1').text if item.find('ccbaMnm1') is not None else ''
                    address = item.find('ccbaLcad').text if item.find('ccbaLcad') is not None else ''
                    
                    # Try to extract coordinates (if available)
                    lat_elem = item.find('latitude')
                    lng_elem = item.find('longitude')
                    
                    latitude = float(lat_elem.text) if lat_elem is not None and lat_elem.text else None
                    longitude = float(lng_elem.text) if lng_elem is not None and lng_elem.text else None
                    
                    if name and (latitude and longitude):
                        sites.append({
                            'id': f"cha_{item.find('ccbaKdcd').text if item.find('ccbaKdcd') is not None else ''}",
                            'name': name,
                            'category': category,
                            'address': address,
                            'latitude': latitude,
                            'longitude': longitude,
                            'description': item.find('content').text if item.find('content') is not None else '',
                            'designation_date': item.find('ccbaAsdt').text if item.find('ccbaAsdt') is not None else '',
                            'source': 'cha',
                            'heritage_number': item.find('ccbaKdcd').text if item.find('ccbaKdcd') is not None else ''
                        })
                except Exception as e:
                    logger.warning(f"Error parsing CHA XML item: {e}")
                    continue
            
        except Exception as e:
            logger.error(f"Error parsing CHA XML response: {str(e)}")
        
        return sites
    
    def _classify_heritage_category(self, title: str) -> str:
        """
        Classify heritage category based on title keywords
        """
        title_lower = title.lower()
        
        if any(keyword in title_lower for keyword in ['궁', '궁궐', 'palace']):
            return '사적'
        elif any(keyword in title_lower for keyword in ['사찰', '절', '암', 'temple']):
            return '사적'
        elif any(keyword in title_lower for keyword in ['박물관', 'museum']):
            return '문화재자료'
        elif any(keyword in title_lower for keyword in ['공원', '정원', 'park', 'garden']):
            return '명승'
        else:
            return '시도유형문화재'
    
    def _score_heritage_sites(self, sites: List[Dict[str, Any]], lat: float, lng: float,
                            user: Optional[User], preferences: Optional[Dict]) -> List[Dict[str, Any]]:
        """
        Score heritage sites based on various factors
        """
        scored_sites = []
        
        for site in sites:
            score = 0
            
            # Base score from heritage category priority
            category = site.get('category', '문화재자료')
            category_info = self.heritage_categories.get(category, {'priority': 1})
            score += category_info['priority'] * 10
            
            # Distance factor (closer is better)
            distance = site.get('distance', 0)
            if distance <= 500:
                score += 20
            elif distance <= 1000:
                score += 15
            elif distance <= 2000:
                score += 10
            elif distance <= 5000:
                score += 5
            
            # User preference factors
            if preferences:
                # Historical period preference
                if preferences.get('historical_periods'):
                    if any(period in site.get('description', '') for period in preferences['historical_periods']):
                        score += 15
                
                # Architecture type preference
                if preferences.get('architecture_types'):
                    if any(arch_type in site.get('name', '') + site.get('description', '') 
                          for arch_type in preferences['architecture_types']):
                        score += 10
                
                # Accessibility requirements
                if preferences.get('wheelchair_accessible') and site.get('facilities', {}).get('wheelchair_accessible'):
                    score += 5
            
            # Availability of detailed information
            if site.get('description'):
                score += 5
            if site.get('phone'):
                score += 3
            if site.get('image_url'):
                score += 3
            
            # Source reliability
            if site.get('source') == 'cha':
                score += 5  # Official heritage administration data
            
            site['recommendation_score'] = score
            site['category_info'] = category_info
            scored_sites.append(site)
        
        return scored_sites
    
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
    
    def _remove_duplicate_sites(self, sites: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Remove duplicate heritage sites based on name and location similarity
        """
        unique_sites = []
        
        for site in sites:
            is_duplicate = False
            
            for existing in unique_sites:
                # Check if within 100 meters and similar name
                if (site.get('latitude') and site.get('longitude') and 
                    existing.get('latitude') and existing.get('longitude')):
                    
                    distance = self._calculate_distance(
                        site['latitude'], site['longitude'],
                        existing['latitude'], existing['longitude']
                    )
                    
                    if distance < 100 and self._similar_names(site.get('name', ''), existing.get('name', '')):
                        is_duplicate = True
                        break
            
            if not is_duplicate:
                unique_sites.append(site)
        
        return unique_sites
    
    def _similar_names(self, name1: str, name2: str) -> bool:
        """
        Check if two heritage site names are similar
        """
        if not name1 or not name2:
            return False
        
        name1_clean = name1.replace(' ', '').replace('-', '').lower()
        name2_clean = name2.replace(' ', '').replace('-', '').lower()
        
        # Check for exact match or substring match
        return (name1_clean == name2_clean or 
                name1_clean in name2_clean or 
                name2_clean in name1_clean or
                len(set(name1_clean) & set(name2_clean)) / max(len(name1_clean), len(name2_clean)) > 0.7)
    
    async def get_heritage_details(self, heritage_id: str) -> Optional[Dict[str, Any]]:
        """
        Get detailed information about a specific heritage site
        """
        try:
            # Extract source and ID from heritage_id
            if heritage_id.startswith('cha_'):
                return await self._get_cha_heritage_details(heritage_id.replace('cha_', ''))
            elif heritage_id.startswith('kto_'):
                return await self._get_kto_heritage_details(heritage_id.replace('kto_', ''))
            
            return None
            
        except Exception as e:
            logger.error(f"Error getting heritage details for {heritage_id}: {str(e)}")
            return None
    
    async def _get_cha_heritage_details(self, heritage_code: str) -> Optional[Dict[str, Any]]:
        """
        Get detailed information from CHA API
        """
        # Implementation for detailed CHA heritage information
        # This would involve additional API calls to get comprehensive details
        return None
    
    async def _get_kto_heritage_details(self, content_id: str) -> Optional[Dict[str, Any]]:
        """
        Get detailed information from KTO API
        """
        return await self._get_kto_detail_info(content_id)

# Service instance
heritage_service = HeritageService()

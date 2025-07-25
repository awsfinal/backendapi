import requests
import logging
from typing import Optional
from config import settings
from models import PlaceInfo

logger = logging.getLogger(__name__)

class NaverMapService:
    def __init__(self):
        self.client_id = settings.NAVER_CLIENT_ID
        self.client_secret = settings.NAVER_CLIENT_SECRET
        self.geocoding_url = "https://naveropenapi.apigw.ntruss.com/map-geocoding/v2/geocode"
        self.reverse_geocoding_url = "https://naveropenapi.apigw.ntruss.com/map-reversegeocode/v2/gc"
        self.search_url = "https://openapi.naver.com/v1/search/local.json"
        
        self.headers = {
            "X-NCP-APIGW-API-KEY-ID": self.client_id,
            "X-NCP-APIGW-API-KEY": self.client_secret
        }
        
        # 검색 API용 헤더 (다른 형식)
        self.search_headers = {
            "X-Naver-Client-Id": self.client_id,
            "X-Naver-Client-Secret": self.client_secret
        }

    async def get_place_by_coordinates(self, latitude: float, longitude: float) -> Optional[PlaceInfo]:
        """
        GPS 좌표를 기반으로 장소 정보를 조회합니다.
        """
        try:
            # 좌표 -> 주소 변환 (Reverse Geocoding)
            params = {
                "coords": f"{longitude},{latitude}",
                "sourcecrs": "epsg:4326",
                "targetcrs": "epsg:4326",
                "orders": "roadaddr,addr"
            }
            
            response = requests.get(
                self.reverse_geocoding_url, 
                headers=self.headers, 
                params=params
            )
            response.raise_for_status()
            
            data = response.json()
            
            if data.get('status', {}).get('code') != 0:
                logger.warning(f"Naver API error: {data.get('status', {}).get('name')}")
                return None
            
            results = data.get('results', [])
            if not results:
                logger.warning(f"No address found for coordinates: {latitude}, {longitude}")
                return None
            
            # 도로명 주소 우선, 없으면 지번 주소 사용
            address_info = results[0]
            region = address_info.get('region', {})
            land = address_info.get('land', {})
            
            # 주소 구성
            area1 = region.get('area1', {}).get('name', '')  # 시/도
            area2 = region.get('area2', {}).get('name', '')  # 시/군/구
            area3 = region.get('area3', {}).get('name', '')  # 읍/면/동
            area4 = region.get('area4', {}).get('name', '')  # 리
            
            full_address = f"{area1} {area2} {area3}"
            if area4:
                full_address += f" {area4}"
            
            # 도로명 주소가 있으면 사용
            if land.get('name'):
                full_address += f" {land.get('name')}"
                if land.get('number1'):
                    full_address += f" {land.get('number1')}"
                    if land.get('number2'):
                        full_address += f"-{land.get('number2')}"
            
            # 주변 장소 검색
            place_info = await self._search_nearby_places(latitude, longitude)
            
            if place_info:
                place_info.address = full_address.strip()
                return place_info
            
            # 주변 장소가 없으면 기본 정보 반환
            return PlaceInfo(
                place_name=area3 if area3 else '알 수 없는 장소',
                address=full_address.strip(),
                category="일반"
            )
            
        except requests.RequestException as e:
            logger.error(f"Naver API request failed: {e}")
            return None
        except Exception as e:
            logger.error(f"Error getting place info: {e}")
            return None

    async def _search_nearby_places(self, latitude: float, longitude: float, radius: int = 500) -> Optional[PlaceInfo]:
        """
        주변 관심 장소를 검색합니다.
        """
        try:
            # 관광지, 문화시설 등을 검색
            keywords = ["관광지", "박물관", "미술관", "공원", "명소"]
            
            for keyword in keywords:
                params = {
                    "query": keyword,
                    "display": 5,
                    "start": 1,
                    "sort": "random"
                }
                
                response = requests.get(
                    self.search_url, 
                    headers=self.search_headers, 
                    params=params
                )
                response.raise_for_status()
                
                data = response.json()
                items = data.get('items', [])
                
                # 거리 계산하여 가까운 장소 찾기
                for item in items:
                    # 네이버 검색 API는 정확한 좌표를 제공하지 않으므로
                    # 주소 기반으로 대략적인 매칭 수행
                    if self._is_nearby_address(item.get('address', ''), latitude, longitude):
                        return PlaceInfo(
                            place_name=self._clean_html_tags(item.get('title', '')),
                            address=item.get('address', ''),
                            category=item.get('category', keyword)
                        )
            
            return None
            
        except Exception as e:
            logger.error(f"Error searching nearby places: {e}")
            return None

    def _is_nearby_address(self, address: str, latitude: float, longitude: float) -> bool:
        """
        주소가 주어진 좌표 근처인지 대략적으로 판단합니다.
        실제 구현에서는 더 정교한 거리 계산이 필요할 수 있습니다.
        """
        # 간단한 구현: 주소에서 시/군/구 정보를 추출하여 비교
        # 실제로는 geocoding을 통해 정확한 좌표 비교를 해야 합니다.
        return True  # 임시로 모든 주소를 허용

    def _clean_html_tags(self, text: str) -> str:
        """
        HTML 태그를 제거합니다.
        """
        import re
        clean = re.compile('<.*?>')
        return re.sub(clean, '', text)

    async def search_place_by_keyword(self, keyword: str, latitude: float = None, longitude: float = None) -> Optional[PlaceInfo]:
        """
        키워드로 장소를 검색합니다.
        """
        try:
            params = {
                "query": keyword,
                "display": 1,
                "start": 1,
                "sort": "random"
            }
            
            response = requests.get(
                self.search_url, 
                headers=self.search_headers, 
                params=params
            )
            response.raise_for_status()
            
            data = response.json()
            items = data.get('items', [])
            
            if items:
                item = items[0]
                return PlaceInfo(
                    place_name=self._clean_html_tags(item.get('title', '')),
                    address=item.get('address', ''),
                    category=item.get('category', '')
                )
            
            return None
            
        except Exception as e:
            logger.error(f"Error searching place by keyword: {e}")
            return None

    async def geocode_address(self, address: str) -> Optional[tuple]:
        """
        주소를 좌표로 변환합니다.
        """
        try:
            params = {
                "query": address
            }
            
            response = requests.get(
                self.geocoding_url, 
                headers=self.headers, 
                params=params
            )
            response.raise_for_status()
            
            data = response.json()
            
            if data.get('status') != 'OK':
                logger.warning(f"Geocoding failed for address: {address}")
                return None
            
            addresses = data.get('addresses', [])
            if addresses:
                location = addresses[0]
                return (float(location['y']), float(location['x']))  # (latitude, longitude)
            
            return None
            
        except Exception as e:
            logger.error(f"Error geocoding address: {e}")
            return None

naver_service = NaverMapService()

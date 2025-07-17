#!/usr/bin/env python3
"""
새로운 카카오 API 키 테스트 스크립트
"""
import requests

def test_new_api_key(api_key):
    """새 API 키 테스트"""
    headers = {'Authorization': f'KakaoAK {api_key}'}
    
    print(f"API 키 테스트: {api_key}")
    print("="*50)
    
    # 키워드 검색 테스트
    try:
        url = 'https://dapi.kakao.com/v2/local/search/keyword.json'
        params = {'query': '경복궁', 'size': 1}
        
        response = requests.get(url, headers=headers, params=params)
        print(f"상태 코드: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("✅ API 키 정상 작동!")
            if data.get('documents'):
                place = data['documents'][0]
                print(f"검색 결과: {place.get('place_name')} - {place.get('address_name')}")
            return True
        else:
            print(f"❌ API 오류: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ 테스트 실패: {e}")
        return False

if __name__ == "__main__":
    # 새 API 키를 여기에 입력하세요
    new_api_key = input("새로운 API 키를 입력하세요: ").strip()
    
    if new_api_key:
        if test_new_api_key(new_api_key):
            print(f"\n✅ 새 API 키가 정상 작동합니다!")
            print(f"📝 .env 파일을 다음과 같이 업데이트하세요:")
            print(f"KAKAO_REST_API_KEY={new_api_key}")
        else:
            print(f"\n❌ API 키에 문제가 있습니다. 권한 설정을 확인해주세요.")
    else:
        print("API 키가 입력되지 않았습니다.")

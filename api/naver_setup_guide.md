# Naver Map API 설정 가이드

## 1. Naver Cloud Platform 계정 생성
1. [Naver Cloud Platform](https://www.ncloud.com/)에 접속
2. 회원가입 또는 로그인
3. 콘솔에 접속

## 2. Maps API 서비스 신청
1. 콘솔에서 "AI·Application Service" → "Maps" 선택
2. "Maps" 서비스 이용 신청
3. 서비스 약관 동의 후 신청 완료

## 3. 인증키 발급
1. "Application" → "Application 등록" 클릭
2. Application 정보 입력:
   - Application 이름: 원하는 이름 입력
   - Service 선택: Maps (Geocoding, Reverse Geocoding)
3. 등록 완료 후 Client ID와 Client Secret 확인

## 4. 추가 API 서비스 (선택사항)
### 네이버 검색 API (장소 검색용)
1. [네이버 개발자 센터](https://developers.naver.com/main/)에 접속
2. "Application" → "애플리케이션 등록" 클릭
3. 애플리케이션 정보 입력:
   - 애플리케이션 이름: 원하는 이름
   - 사용 API: 검색 (지역)
   - 환경 추가: 웹 서비스 URL 입력
4. 등록 완료 후 Client ID와 Client Secret 확인

## 5. 환경변수 설정
`.env` 파일에 다음 정보를 추가:

```env
# Naver API
NAVER_CLIENT_ID=your_naver_client_id
NAVER_CLIENT_SECRET=your_naver_client_secret
```

## 6. API 사용량 및 요금
- Maps API: 월 100,000건까지 무료
- 검색 API: 일 25,000건까지 무료
- 초과 시 유료 과금

## 7. API 엔드포인트
- **Geocoding**: 주소 → 좌표 변환
  - `https://naveropenapi.apigw.ntruss.com/map-geocoding/v2/geocode`
- **Reverse Geocoding**: 좌표 → 주소 변환
  - `https://naveropenapi.apigw.ntruss.com/map-reversegeocode/v2/gc`
- **지역 검색**: 키워드로 장소 검색
  - `https://openapi.naver.com/v1/search/local.json`

## 8. 주의사항
- Client ID와 Client Secret은 외부에 노출되지 않도록 주의
- API 호출 시 적절한 에러 처리 구현
- 사용량 모니터링을 통해 예상치 못한 과금 방지

## 9. 테스트
API 설정이 완료되면 다음 엔드포인트로 테스트:
- `GET /api/v1/gps-to-place?latitude=37.5665&longitude=126.9780`
- `GET /api/v1/search-place?keyword=서울시청`

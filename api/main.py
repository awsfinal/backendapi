from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
import uuid
import time
import logging
from datetime import datetime
from typing import Optional

# Local imports
from config import settings
from models import (
    GPSCoordinates, PhotoCaptureRequest, AnalysisStatus, 
    ErrorResponse, PlaceInfo, EXIFData, CameraInfo, PhotoAnalysisResponse
)
from services.s3_service import s3_service
from services.sqs_service import sqs_service
from services.naver_service import naver_service
from utils.validators import validate_image_file, validate_image_content, validate_gps_coordinates
from utils.responses import create_error_response, create_success_response, APIException
from utils.exif_processor import exif_processor

# 로깅 설정
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# FastAPI 앱 초기화
app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    debug=False  # Production mode
)

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 프로덕션에서는 특정 도메인으로 제한
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 정적 파일 서빙 설정
app.mount("/static", StaticFiles(directory="static"), name="static")

# 메모리 기반 임시 저장소 (프로덕션에서는 Redis나 DynamoDB 사용 권장)
analysis_status_store = {}

# Include production routers
from auth_endpoints import router as auth_router
from location_endpoints import router as location_router

app.include_router(auth_router)
app.include_router(location_router)

@app.get("/")
async def root():
    """
    API 루트 엔드포인트
    """
    return {
        "message": "Historical Place Recognition API",
        "version": settings.VERSION,
        "status": "running",
        "timestamp": datetime.now().isoformat()
    }

@app.get("/health")
async def health_check():
    """
    헬스 체크 엔드포인트
    """
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "version": settings.VERSION
    }

@app.post(f"{settings.API_V1_PREFIX}/upload-photo")
async def upload_photo(
    file: UploadFile = File(..., description="분석할 사진 파일"),
    device_latitude: Optional[float] = Form(None, description="디바이스 GPS 위도"),
    device_longitude: Optional[float] = Form(None, description="디바이스 GPS 경도"),
):
    """
    사진 업로드 및 분석 요청
    """
    request_id = str(uuid.uuid4())
    start_time = time.time()
    
    try:
        # 입력 검증
        if not file:
            raise APIException(
                status_code=400,
                error="INVALID_INPUT",
                message="사진 파일이 필요합니다."
            )
        
        # 파일 검증
        validate_image_file(file)
        
        # 파일 내용 읽기
        file_content = await file.read()
        validate_image_content(file_content)
        
        # GPS 좌표 검증
        if device_latitude is not None and device_longitude is not None:
            validate_gps_coordinates(device_latitude, device_longitude)
        
        # EXIF 데이터 추출
        exif_data = exif_processor.extract_exif_data(file_content)
        
        # GPS 좌표 결정 (디바이스 GPS 우선, 없으면 EXIF GPS 사용)
        final_latitude = device_latitude or exif_data.get('gps_latitude')
        final_longitude = device_longitude or exif_data.get('gps_longitude')
        
        # S3에 파일 업로드
        s3_key = f"photos/{request_id}/{file.filename}"
        s3_url = await s3_service.upload_file(
            file_content=file_content,
            key=s3_key,
            content_type=file.content_type
        )
        
        # SQS에 분석 요청 메시지 전송
        message_data = {
            "request_id": request_id,
            "s3_url": s3_url,
            "s3_key": s3_key,
            "filename": file.filename,
            "content_type": file.content_type,
            "file_size": len(file_content),
            "gps_coordinates": {
                "latitude": final_latitude,
                "longitude": final_longitude
            } if final_latitude and final_longitude else None,
            "exif_data": exif_data,
            "timestamp": datetime.now().isoformat()
        }
        
        await sqs_service.send_message(message_data)
        
        # 분석 상태 저장
        analysis_status_store[request_id] = {
            "status": "processing",
            "created_at": datetime.now().isoformat(),
            "s3_url": s3_url,
            "filename": file.filename
        }
        
        processing_time = time.time() - start_time
        
        return create_success_response(
            data={
                "request_id": request_id,
                "status": "processing",
                "message": "사진이 성공적으로 업로드되었습니다. 분석이 진행 중입니다.",
                "s3_url": s3_url,
                "processing_time": round(processing_time, 3)
            },
            request_id=request_id
        )
        
    except APIException as e:
        processing_time = time.time() - start_time
        logger.error(f"API Exception in upload_photo: {e.message}")
        return create_error_response(
            status_code=e.status_code,
            error=e.error,
            message=e.message,
            request_id=request_id,
            processing_time=round(processing_time, 3)
        )
    except Exception as e:
        processing_time = time.time() - start_time
        logger.error(f"Unexpected error in upload_photo: {str(e)}")
        return create_error_response(
            status_code=500,
            error="UPLOAD_FAILED",
            message=f"사진 업로드 중 오류가 발생했습니다: {str(e)}",
            request_id=request_id,
            processing_time=round(processing_time, 3)
        )

@app.get(f"{settings.API_V1_PREFIX}/analysis-status/{{request_id}}")
async def get_analysis_status(request_id: str):
    """
    분석 상태 조회
    """
    try:
        if request_id not in analysis_status_store:
            raise HTTPException(status_code=404, detail="Analysis request not found")
        
        status_info = analysis_status_store[request_id]
        
        return create_success_response(
            data={
                "request_id": request_id,
                "status": status_info["status"],
                "created_at": status_info["created_at"],
                "filename": status_info.get("filename"),
                "result": status_info.get("result")
            },
            request_id=request_id
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting analysis status: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get analysis status")

@app.post(f"{settings.API_V1_PREFIX}/analysis-result")
async def receive_analysis_result(
    request_id: str = Form(...),
    status: str = Form(...),
    result: Optional[str] = Form(None)
):
    """
    Lambda에서 분석 결과 수신
    """
    try:
        if request_id in analysis_status_store:
            analysis_status_store[request_id].update({
                "status": status,
                "result": result,
                "completed_at": datetime.now().isoformat()
            })
            
            return {"message": "Analysis result received successfully"}
        else:
            raise HTTPException(status_code=404, detail="Request ID not found")
            
    except Exception as e:
        logger.error(f"Error receiving analysis result: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to process result")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

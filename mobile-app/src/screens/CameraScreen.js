import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image,
  Dimensions,
  Platform,
  Linking
} from 'react-native';
import { Button, Card, ActivityIndicator, Title, Paragraph } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';

import { CameraService } from '../services/CameraService';

const { width, height } = Dimensions.get('window');

export default function CameraScreen({ navigation }) {
  const [hasPermissions, setHasPermissions] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState('');

  useEffect(() => {
    checkPermissions();
  }, []);

  const checkPermissions = async () => {
    try {
      const permissions = await CameraService.requestPermissions();
      
      // 카메라 권한은 필수, 위치 권한은 선택적
      const hasRequiredPermissions = permissions.camera && permissions.mediaLibrary;
      setHasPermissions(hasRequiredPermissions);
      
      if (!permissions.camera) {
        Alert.alert(
          '카메라 권한 필요', 
          '사진 촬영을 위해 카메라 권한이 필요합니다. 설정에서 권한을 허용해주세요.',
          [
            { text: '취소', style: 'cancel' },
            { text: '설정으로 이동', onPress: () => {
              // iOS에서 설정 앱으로 이동
              if (Platform.OS === 'ios') {
                Linking.openURL('app-settings:');
              }
            }}
          ]
        );
      }
      
      if (!permissions.mediaLibrary) {
        Alert.alert(
          '사진 라이브러리 권한 필요', 
          '갤러리에서 사진을 선택하기 위해 사진 라이브러리 권한이 필요합니다.',
          [
            { text: '취소', style: 'cancel' },
            { text: '설정으로 이동', onPress: () => {
              if (Platform.OS === 'ios') {
                Linking.openURL('app-settings:');
              }
            }}
          ]
        );
      }
      
      if (!permissions.location) {
        Alert.alert(
          '위치 권한 안내', 
          '위치 권한이 없으면 GPS 정보 없이 사진 분석이 진행됩니다. 더 정확한 분석을 위해 위치 권한을 허용하는 것을 권장합니다.',
          [{ text: '확인' }]
        );
      }
      
    } catch (error) {
      console.error('Permission check error:', error);
      Alert.alert('오류', '권한 확인 중 오류가 발생했습니다. 앱을 다시 시작해주세요.');
      setHasPermissions(false);
    }
  };

  const handleTakePhoto = async () => {
    try {
      if (!hasPermissions) {
        await checkPermissions();
        return;
      }

      const result = await CameraService.capturePhotoWithLocation();
      
      if (result) {
        setCapturedPhoto(result);
      }
    } catch (error) {
      console.error('Take photo error:', error);
      Alert.alert('오류', '사진 촬영 중 오류가 발생했습니다.');
    }
  };

  const handleSelectFromGallery = async () => {
    try {
      const result = await CameraService.selectPhotoFromGallery();
      
      if (result) {
        setCapturedPhoto(result);
      }
    } catch (error) {
      console.error('Select photo error:', error);
      Alert.alert('오류', '사진 선택 중 오류가 발생했습니다.');
    }
  };

  const handleAnalyzePhoto = async () => {
    if (!capturedPhoto) {
      Alert.alert('알림', '먼저 사진을 촬영하거나 선택해주세요.');
      return;
    }

    try {
      setIsAnalyzing(true);
      setAnalysisProgress('사진을 업로드하는 중...');

      // Upload photo for analysis
      const uploadResult = await CameraService.uploadPhotoForAnalysis(
        capturedPhoto.photoUri,
        capturedPhoto.location
      );

      setAnalysisProgress('AI가 분석하는 중...');

      // Poll for analysis result
      const analysisResult = await CameraService.pollAnalysisResult(
        uploadResult.request_id
      );

      // Navigate to results screen
      navigation.navigate('AnalysisResult', {
        photo: capturedPhoto,
        result: analysisResult
      });

    } catch (error) {
      console.error('Analysis error:', error);
      Alert.alert('분석 실패', error.message || '사진 분석 중 오류가 발생했습니다.');
    } finally {
      setIsAnalyzing(false);
      setAnalysisProgress('');
    }
  };

  const handleRetakePhoto = () => {
    setCapturedPhoto(null);
  };

  if (!hasPermissions) {
    return (
      <View style={styles.permissionContainer}>
        <Ionicons name="camera-outline" size={80} color="#ccc" />
        <Text style={styles.permissionTitle}>권한이 필요합니다</Text>
        <Text style={styles.permissionText}>
          사진 분석을 위해 카메라와 위치 권한이 필요합니다.
        </Text>
        <Button mode="contained" onPress={checkPermissions} style={styles.permissionButton}>
          권한 확인
        </Button>
      </View>
    );
  }

  if (isAnalyzing) {
    return (
      <View style={styles.analyzingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.analyzingTitle}>분석 중...</Text>
        <Text style={styles.analyzingText}>{analysisProgress}</Text>
        <Text style={styles.analyzingSubtext}>
          잠시만 기다려주세요. AI가 사진을 분석하고 있습니다.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {capturedPhoto ? (
        // Photo Preview
        <View style={styles.previewContainer}>
          <Image source={{ uri: capturedPhoto.photoUri }} style={styles.previewImage} />
          
          <Card style={styles.photoInfoCard}>
            <Card.Content>
              <Title>사진 정보</Title>
              {capturedPhoto.location ? (
                <View>
                  <Paragraph>📍 위치: {capturedPhoto.location.latitude.toFixed(4)}, {capturedPhoto.location.longitude.toFixed(4)}</Paragraph>
                  <Paragraph>🎯 정확도: {capturedPhoto.location.accuracy?.toFixed(0)}m</Paragraph>
                </View>
              ) : (
                <Paragraph>📍 위치 정보 없음</Paragraph>
              )}
              {capturedPhoto.exif?.DateTime && (
                <Paragraph>📅 촬영 시간: {capturedPhoto.exif.DateTime}</Paragraph>
              )}
            </Card.Content>
          </Card>

          <View style={styles.buttonContainer}>
            <Button
              mode="outlined"
              onPress={handleRetakePhoto}
              style={[styles.button, styles.retakeButton]}
            >
              다시 촬영
            </Button>
            <Button
              mode="contained"
              onPress={handleAnalyzePhoto}
              style={[styles.button, styles.analyzeButton]}
            >
              분석 시작
            </Button>
          </View>
        </View>
      ) : (
        // Camera Interface
        <View style={styles.cameraContainer}>
          <View style={styles.instructionContainer}>
            <Ionicons name="camera" size={80} color="#2196F3" />
            <Text style={styles.instructionTitle}>역사적 장소 사진 분석</Text>
            <Text style={styles.instructionText}>
              건물이나 문화재 사진을 촬영하면 AI가 역사적 정보를 분석해드립니다.
            </Text>
          </View>

          <View style={styles.cameraButtonContainer}>
            <TouchableOpacity style={styles.cameraButton} onPress={handleTakePhoto}>
              <Ionicons name="camera" size={40} color="#fff" />
              <Text style={styles.cameraButtonText}>사진 촬영</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.galleryButton} onPress={handleSelectFromGallery}>
              <Ionicons name="images" size={40} color="#2196F3" />
              <Text style={styles.galleryButtonText}>갤러리에서 선택</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.tipsContainer}>
            <Text style={styles.tipsTitle}>📸 촬영 팁</Text>
            <Text style={styles.tipsText}>• 건물 전체가 잘 보이도록 촬영하세요</Text>
            <Text style={styles.tipsText}>• 밝은 곳에서 촬영하면 더 정확합니다</Text>
            <Text style={styles.tipsText}>• 문화재 안내판도 함께 촬영하세요</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
    color: '#333',
  },
  permissionText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    marginBottom: 30,
    lineHeight: 24,
  },
  permissionButton: {
    paddingHorizontal: 20,
  },
  analyzingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  analyzingTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 20,
    color: '#333',
  },
  analyzingText: {
    fontSize: 16,
    color: '#2196F3',
    marginTop: 10,
    fontWeight: 'bold',
  },
  analyzingSubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 20,
    textAlign: 'center',
    lineHeight: 20,
  },
  cameraContainer: {
    flex: 1,
    padding: 20,
  },
  instructionContainer: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 40,
  },
  instructionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
    color: '#333',
    textAlign: 'center',
  },
  instructionText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  cameraButtonContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  cameraButton: {
    backgroundColor: '#2196F3',
    borderRadius: 80,
    width: 160,
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    marginBottom: 20,
  },
  cameraButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 8,
  },
  galleryButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderWidth: 2,
    borderColor: '#2196F3',
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
  },
  galleryButtonText: {
    color: '#2196F3',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  tipsContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    elevation: 2,
  },
  tipsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  tipsText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    lineHeight: 20,
  },
  previewContainer: {
    flex: 1,
    padding: 16,
  },
  previewImage: {
    width: '100%',
    height: height * 0.4,
    borderRadius: 12,
    marginBottom: 16,
  },
  photoInfoCard: {
    marginBottom: 16,
    elevation: 2,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    flex: 1,
    marginHorizontal: 8,
  },
  retakeButton: {
    borderColor: '#666',
  },
  analyzeButton: {
    backgroundColor: '#2196F3',
  },
});

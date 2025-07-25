import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Dimensions
} from 'react-native';
import { Card, Title, Paragraph, Button, Chip } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function AnalysisResultScreen({ route, navigation }) {
  const { photo, result } = route.params;

  const handleViewOnMap = () => {
    if (photo.location) {
      navigation.navigate('Map', {
        initialRegion: {
          latitude: photo.location.latitude,
          longitude: photo.location.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }
      });
    }
  };

  const handleSaveToFavorites = () => {
    // Implement save to favorites functionality
    alert('즐겨찾기에 저장되었습니다!');
  };

  return (
    <ScrollView style={styles.container}>
      {/* Photo */}
      <Image source={{ uri: photo.photoUri }} style={styles.photo} />

      {/* Analysis Result */}
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.title}>분석 결과</Title>
          
          {result.place_info && (
            <View style={styles.placeInfo}>
              <Text style={styles.placeName}>{result.place_info.place_name}</Text>
              <Text style={styles.placeAddress}>{result.place_info.address}</Text>
              {result.place_info.category && (
                <Chip style={styles.categoryChip} textStyle={styles.categoryText}>
                  {result.place_info.category}
                </Chip>
              )}
            </View>
          )}

          {result.historical_description && (
            <View style={styles.descriptionContainer}>
              <Text style={styles.sectionTitle}>📜 역사적 설명</Text>
              <Paragraph style={styles.description}>
                {result.historical_description}
              </Paragraph>
            </View>
          )}

          {result.building_analysis && (
            <View style={styles.analysisContainer}>
              <Text style={styles.sectionTitle}>🏛️ 건축 분석</Text>
              
              {result.building_analysis.building_labels && (
                <View style={styles.labelsContainer}>
                  <Text style={styles.subTitle}>감지된 특징:</Text>
                  <View style={styles.chipContainer}>
                    {result.building_analysis.building_labels.map((label, index) => (
                      <Chip key={index} style={styles.featureChip}>
                        {label.name} ({Math.round(label.confidence)}%)
                      </Chip>
                    ))}
                  </View>
                </View>
              )}

              {result.building_analysis.detected_text && result.building_analysis.detected_text.length > 0 && (
                <View style={styles.textContainer}>
                  <Text style={styles.subTitle}>감지된 텍스트:</Text>
                  {result.building_analysis.detected_text.map((text, index) => (
                    <Text key={index} style={styles.detectedText}>
                      • {text.text}
                    </Text>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* Location Info */}
          {photo.location && (
            <View style={styles.locationContainer}>
              <Text style={styles.sectionTitle}>📍 위치 정보</Text>
              <Text style={styles.locationText}>
                위도: {photo.location.latitude.toFixed(6)}
              </Text>
              <Text style={styles.locationText}>
                경도: {photo.location.longitude.toFixed(6)}
              </Text>
              {photo.location.accuracy && (
                <Text style={styles.locationText}>
                  정확도: ±{Math.round(photo.location.accuracy)}m
                </Text>
              )}
            </View>
          )}
        </Card.Content>
      </Card>

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <Button
          mode="outlined"
          onPress={handleViewOnMap}
          style={styles.button}
          icon="map"
          disabled={!photo.location}
        >
          지도에서 보기
        </Button>
        
        <Button
          mode="contained"
          onPress={handleSaveToFavorites}
          style={styles.button}
          icon="heart"
        >
          즐겨찾기 저장
        </Button>
      </View>

      {/* Bottom Spacing */}
      <View style={styles.bottomSpacing} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  photo: {
    width: '100%',
    height: 250,
  },
  card: {
    margin: 16,
    elevation: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 16,
  },
  placeInfo: {
    marginBottom: 20,
  },
  placeName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  placeAddress: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  categoryChip: {
    alignSelf: 'flex-start',
    backgroundColor: '#E3F2FD',
  },
  categoryText: {
    color: '#2196F3',
  },
  descriptionContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: '#444',
  },
  analysisContainer: {
    marginBottom: 20,
  },
  labelsContainer: {
    marginBottom: 16,
  },
  subTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#555',
    marginBottom: 8,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  featureChip: {
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: '#F3E5F5',
  },
  textContainer: {
    marginBottom: 16,
  },
  detectedText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  locationContainer: {
    marginBottom: 20,
  },
  locationText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  button: {
    flex: 1,
    marginHorizontal: 8,
  },
  bottomSpacing: {
    height: 20,
  },
});

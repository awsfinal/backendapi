import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert
} from 'react-native';
import { Card, Title, Paragraph, Button, Chip, Divider } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';

export default function HeritageDetailScreen({ route, navigation }) {
  const { heritage } = route.params;
  const [isFavorite, setIsFavorite] = useState(false);

  const handleCall = () => {
    if (heritage.phone) {
      Linking.openURL(`tel:${heritage.phone}`);
    } else {
      Alert.alert('알림', '전화번호 정보가 없습니다.');
    }
  };

  const handleDirections = () => {
    if (heritage.latitude && heritage.longitude) {
      const url = `https://map.naver.com/v5/directions/${heritage.longitude},${heritage.latitude}`;
      Linking.openURL(url);
    } else {
      Alert.alert('알림', '위치 정보가 없습니다.');
    }
  };

  const handleToggleFavorite = () => {
    setIsFavorite(!isFavorite);
    Alert.alert(
      '즐겨찾기',
      isFavorite ? '즐겨찾기에서 제거되었습니다.' : '즐겨찾기에 추가되었습니다.'
    );
  };

  const handleShare = () => {
    Alert.alert(
      '공유하기',
      `${heritage.name}에 대한 정보를 공유하시겠습니까?`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '공유',
          onPress: () => {
            // In real app, implement sharing functionality
            Alert.alert('공유', '공유 기능이 구현될 예정입니다.');
          }
        }
      ]
    );
  };

  const getCategoryColor = (category) => {
    const colors = {
      '국보': '#FF5722',
      '보물': '#FF9800',
      '사적': '#4CAF50',
      '명승': '#2196F3',
      '천연기념물': '#9C27B0',
      '중요무형문화재': '#607D8B',
      '중요민속문화재': '#795548',
      '시도유형문화재': '#9E9E9E',
      '시도무형문화재': '#9E9E9E',
      '문화재자료': '#9E9E9E',
    };
    return colors[category] || '#9E9E9E';
  };

  const formatDistance = (distance) => {
    if (distance < 1000) {
      return `${distance}m`;
    } else {
      return `${(distance / 1000).toFixed(1)}km`;
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header Card */}
      <Card style={styles.headerCard}>
        <Card.Content>
          <View style={styles.headerContent}>
            <View style={styles.titleContainer}>
              <Title style={styles.title}>{heritage.name}</Title>
              <Chip
                style={[styles.categoryChip, { backgroundColor: getCategoryColor(heritage.category) }]}
                textStyle={styles.categoryText}
              >
                {heritage.category}
              </Chip>
            </View>
            
            <TouchableOpacity
              style={styles.favoriteButton}
              onPress={handleToggleFavorite}
            >
              <Ionicons
                name={isFavorite ? 'heart' : 'heart-outline'}
                size={28}
                color={isFavorite ? '#f44336' : '#666'}
              />
            </TouchableOpacity>
          </View>

          {heritage.address && (
            <View style={styles.addressContainer}>
              <Ionicons name="location" size={16} color="#666" />
              <Text style={styles.address}>{heritage.address}</Text>
            </View>
          )}

          {heritage.distance && (
            <View style={styles.distanceContainer}>
              <Ionicons name="walk" size={16} color="#666" />
              <Text style={styles.distance}>현재 위치에서 {formatDistance(heritage.distance)}</Text>
            </View>
          )}
        </Card.Content>
      </Card>

      {/* Description */}
      {heritage.description && (
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.sectionTitle}>📜 설명</Text>
            <Paragraph style={styles.description}>
              {heritage.description}
            </Paragraph>
          </Card.Content>
        </Card>
      )}

      {/* Heritage Information */}
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.sectionTitle}>ℹ️ 문화재 정보</Text>
          
          {heritage.heritage_number && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>지정번호:</Text>
              <Text style={styles.infoValue}>{heritage.heritage_number}</Text>
            </View>
          )}

          {heritage.designation_date && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>지정일:</Text>
              <Text style={styles.infoValue}>{heritage.designation_date}</Text>
            </View>
          )}

          {heritage.region_code && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>지역코드:</Text>
              <Text style={styles.infoValue}>{heritage.region_code}</Text>
            </View>
          )}

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>정보출처:</Text>
            <Text style={styles.infoValue}>
              {heritage.source === 'cultural_property_api' ? '문화재청' : '한국관광공사'}
            </Text>
          </View>
        </Card.Content>
      </Card>

      {/* Contact Information */}
      {(heritage.phone || heritage.website) && (
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.sectionTitle}>📞 연락처</Text>
            
            {heritage.phone && (
              <TouchableOpacity style={styles.contactItem} onPress={handleCall}>
                <Ionicons name="call" size={20} color="#2196F3" />
                <Text style={styles.contactText}>{heritage.phone}</Text>
                <Ionicons name="chevron-forward" size={20} color="#ccc" />
              </TouchableOpacity>
            )}

            {heritage.website && (
              <TouchableOpacity
                style={styles.contactItem}
                onPress={() => Linking.openURL(heritage.website)}
              >
                <Ionicons name="globe" size={20} color="#2196F3" />
                <Text style={styles.contactText}>웹사이트 방문</Text>
                <Ionicons name="chevron-forward" size={20} color="#ccc" />
              </TouchableOpacity>
            )}
          </Card.Content>
        </Card>
      )}

      {/* Facilities */}
      {heritage.facilities && (
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.sectionTitle}>🏢 편의시설</Text>
            
            <View style={styles.facilitiesContainer}>
              {heritage.facilities.parking && (
                <Chip style={styles.facilityChip} icon="car">
                  주차장
                </Chip>
              )}
              {heritage.facilities.restroom && (
                <Chip style={styles.facilityChip} icon="human-male-female">
                  화장실
                </Chip>
              )}
              {heritage.facilities.wheelchair_accessible && (
                <Chip style={styles.facilityChip} icon="wheelchair-accessibility">
                  휠체어 접근
                </Chip>
              )}
            </View>
          </Card.Content>
        </Card>
      )}

      {/* Fees */}
      {heritage.fees && (
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.sectionTitle}>💰 이용요금</Text>
            
            {heritage.fees.adult && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>성인:</Text>
                <Text style={styles.infoValue}>{heritage.fees.adult}</Text>
              </View>
            )}

            {heritage.fees.info && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>이용시간:</Text>
                <Text style={styles.infoValue}>{heritage.fees.info}</Text>
              </View>
            )}
          </Card.Content>
        </Card>
      )}

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <Button
          mode="outlined"
          onPress={handleDirections}
          style={styles.button}
          icon="directions"
        >
          길찾기
        </Button>
        
        <Button
          mode="contained"
          onPress={handleShare}
          style={styles.button}
          icon="share"
        >
          공유하기
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
  headerCard: {
    margin: 16,
    elevation: 4,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  categoryChip: {
    alignSelf: 'flex-start',
  },
  categoryText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  favoriteButton: {
    padding: 8,
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  address: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    flex: 1,
  },
  distanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  distance: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  card: {
    margin: 16,
    marginVertical: 8,
    elevation: 2,
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
  infoRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
    width: 80,
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  contactText: {
    fontSize: 16,
    color: '#2196F3',
    marginLeft: 12,
    flex: 1,
  },
  facilitiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  facilityChip: {
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: '#E8F5E8',
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

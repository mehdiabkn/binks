import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { useTranslation } from 'react-i18next';

const { height } = Dimensions.get('window');

export default function ProfileHeader({
  firstName,
  currentLevel,
  currentXP,
  memberSince,
  onEditProfile,
  onLevelPress,
}) {
  const { t } = useTranslation();
  
  // Animation de pulsation du profil
  const profilePulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulsing = Animated.loop(
      Animated.sequence([
        Animated.timing(profilePulseAnim, {
          toValue: 1.02,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(profilePulseAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    );
    
    setTimeout(() => pulsing.start(), 1000);
    return () => pulsing.stop();
  }, []);

  // Obtenir l'avatar basé sur le niveau
  const getUserAvatar = () => {
    if (currentLevel >= 10) return '👑';
    if (currentLevel >= 7) return '🏆';
    if (currentLevel >= 5) return '⭐';
    if (currentLevel >= 3) return '🎯';
    return '🛫';
  };

  return (
    <View style={styles.header}>
      <Animated.View 
        style={[
          styles.profileSection,
          { transform: [{ scale: profilePulseAnim }] },
        ]}
      >
        <View style={styles.avatarContainer}>
          <TouchableOpacity onPress={onLevelPress} style={styles.avatarTouchable}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatar}>{getUserAvatar()}</Text>
            </View>
            <View style={styles.levelBadge}>
              <Text style={styles.levelText}>{currentLevel}</Text>
            </View>
          </TouchableOpacity>
        </View>
        
        <View style={styles.profileInfo}>
          <Text style={styles.userName}>{firstName}</Text>
          <Text style={styles.userLevel}>
            {t('settings.profile.level', { level: currentLevel, xp: currentXP })}
          </Text>
          <Text style={styles.memberSince}>
            {t('settings.profile.memberSince', { date: memberSince })}
          </Text>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: height * 0.06,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 15,
  },
  avatarTouchable: {
    position: 'relative',
  },
  avatarCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 3,
    borderColor: '#FFD700',
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    fontSize: 36, // Réduit de 48 à 36 pour éviter le débordement
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0)', // Pas d'ombre
    includeFontPadding: false, // Android uniquement
    textAlignVertical: 'center', // Android uniquement
    lineHeight: 36, // Assure un bon centrage vertical
  },
  levelBadge: {
    position: 'absolute',
    bottom: -5,
    right: -5,
    backgroundColor: '#FFD700',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#0F0F23',
  },
  levelText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 10,
    color: '#000000',
  },
  profileInfo: {
    flex: 1,
  },
  userName: {
    fontFamily: 'Poppins-Bold',
    fontSize: 20,
    color: '#FFFFFF',
    marginBottom: 2,
  },
  userLevel: {
    fontFamily: 'Poppins-Medium',
    fontSize: 12,
    color: '#FFD700',
    marginBottom: 2,
  },
  memberSince: {
    fontFamily: 'Poppins-Regular',
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  editButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editButtonText: {
    fontSize: 16,
  },
});
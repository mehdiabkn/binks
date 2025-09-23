import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Image,
} from 'react-native';
import { useTranslation } from 'react-i18next';

const { height } = Dimensions.get('window');

export default function FutureHeader({ firstName, selectedDate }) {
  const { t } = useTranslation();

  // Formatage de la date sélectionnée
  const formatSelectedDate = (date) => {
    const today = new Date();
    const isToday = date.toDateString() === today.toDateString();
    
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const isTomorrow = date.toDateString() === tomorrow.toDateString();
    
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const isYesterday = date.toDateString() === yesterday.toDateString();
    
    if (isToday) return t('dates.today');
    if (isTomorrow) return t('dates.tomorrow');
    if (isYesterday) return t('dates.yesterday');
    
    // Format: "Lundi 7 août" ou "Monday, August 7"
    const options = {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    };
    return date.toLocaleDateString(t('calendar.locale'), options);
  };

  const getMotivationalEmoji = () => {
    const emojis = ['🌟',  '💪', '✨'];
    return emojis[Math.floor(Math.random() * emojis.length)];
  };

  const defaultFirstName = t('future.header.defaultName', 'Champion');
  const displayName = firstName || defaultFirstName;

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Logo et titre sur la même ligne */}
        <View style={styles.headerRow}>
          <Image 
            source={require('../../assets/images/Logo.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
          <Text style={styles.habitusText}>
            {t('common.appName')}
          </Text>
        </View>
        
        {/* Date en dessous */}
        <Text style={styles.dateText}>
          {formatSelectedDate(selectedDate)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: height * 0.06,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  content: {
    alignItems: 'flex-start', // Alignement à gauche
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  logoImage: {
    width: 40,
    height: 40,
    marginRight: 12,
  },
  habitusText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 24,
    color: '#FFFFFF',
    letterSpacing: 2,
    textShadowColor: 'rgba(255, 255, 255, 0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  dateText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 18,
    color: '#FFD700',
    marginBottom: 4,
    textTransform: 'capitalize',
  },
  subtitle: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
});
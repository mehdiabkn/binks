import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  Animated,
  Image,
} from 'react-native';
import { useTranslation } from 'react-i18next';

export default function StatisticsHeader({ firstName, selectedPeriod, completionRate }) {
  const { t } = useTranslation();
  
  // Animation pour la barre de progression
  const progressAnim = useRef(new Animated.Value(0)).current;
  
  // Animer la barre quand le taux change
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: completionRate,
      duration: 800,
      useNativeDriver: false, // On anime la width, donc pas de native driver
    }).start();
  }, [completionRate, progressAnim]);
  
  // Texte de période traduit
  const getPeriodText = (period) => {
    return t(`statistics.header.periods.${period}`);
  };

  const periodText = getPeriodText(selectedPeriod);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* Container principal */}
      <View style={styles.headerContent}>
        {/* Logo et titre */}
        <View style={styles.titleSection}>
          <Image 
            source={require('../../assets/images/Logo.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
          <View style={styles.titleTextContainer}>
            <Text style={styles.logo}>
              {t('common.appName')}
            </Text>
            <Text style={styles.subtitle}>
              {t('statistics.header.subtitle')}
            </Text>
          </View>
        </View>

        {/* Métriques principales - Version compacte */}
        <View style={styles.metricsSection}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>
              {t('statistics.header.success', { period: periodText })}
            </Text>
            <Text style={styles.percentageText}>{completionRate}%</Text>
          </View>

          {/* Barre de progression */}
          <View style={styles.progressBarContainer}>
            <View style={styles.progressBarBackground}>
              <Animated.View 
                style={[
                  styles.progressBarFill, 
                  { 
                    width: progressAnim.interpolate({
                      inputRange: [0, 100],
                      outputRange: ['0%', '100%'],
                      extrapolate: 'clamp',
                    }),
                    backgroundColor: completionRate >= 80 ? '#4CD964' : 
                                   completionRate >= 60 ? '#FFD700' : 
                                   completionRate >= 40 ? '#FF9500' : '#FF6B6B'
                  }
                ]} 
              />
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0F0F23',
    paddingTop: StatusBar.currentHeight || 44,
    paddingBottom: 20,
  },
  headerContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  
  // Section titre
  titleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  logoImage: {
    width: 40,
    height: 40,
    marginRight: 12,
  },
  titleTextContainer: {
    flex: 1,
  },
  logo: {
    fontFamily: 'Poppins-Bold',
    fontSize: 24,
    color: '#FFFFFF',
    letterSpacing: 2,
    textShadowColor: 'rgba(255, 255, 255, 0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
    marginBottom: 2,
  },
  subtitle: {
    fontFamily: 'Poppins-Medium',
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  
  // Section métriques - Version compacte
  metricsSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  percentageText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 18,
    color: '#FFFFFF',
  },
  
  // Barre de progression
  progressBarContainer: {
    marginTop: 4,
  },
  progressBarBackground: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
    shadowColor: '#4CD964',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.4,
    shadowRadius: 3,
    elevation: 2,
  },
});
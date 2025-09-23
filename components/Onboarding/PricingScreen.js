import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  ScrollView,
  Dimensions,
} from 'react-native';
import { useTranslation } from 'react-i18next';

const { width, height } = Dimensions.get('window');

export default function OfferScreen({ 
  firstName,
  selectedFrustrations = [],
  selectedObjectives = [],
  triggerHaptic 
}) {
  const { t } = useTranslation();
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    // Animation d'entrée séquentielle
    Animated.sequence([
      // Fade in et scale initial
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]),
      // Slide up du contenu
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Fonction pour obtenir les promesses basées sur les objectifs sélectionnés
  const getPersonalizedPromises = () => {
    const allPromises = [
      { key: 'daily_accountability', icon: '🎯' },
      { key: 'progress_tracking', icon: '📊' },
      { key: 'evening_review', icon: '🌙' },
      { key: 'monthly_assessment', icon: '📈' },
      { key: 'habit_formation', icon: '⚡' },
      { key: 'motivation_boost', icon: ' ' },
    ];
    
    return allPromises;
  };

  const promises = getPersonalizedPromises();

  return (
    <Animated.View 
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header personnalisé - Plus compact */}
        <Animated.View 
          style={[
            styles.headerContainer,
            {
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >          
          <Text style={styles.greetingText}>
            {t('offer.greeting', { firstName })}
          </Text>
          
          <View style={styles.insightContainer}>
            <Text style={styles.insightText}>
              {t('offer.insight', { firstName })}
            </Text>
          </View>
        </Animated.View>

        {/* Section proposition */}
        <Animated.View 
          style={[
            styles.propositionContainer,
            {
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Text style={styles.propositionTitle}>
            {t('offer.proposition.title')}
          </Text>
          
          {/* Liste des promesses */}
          <View style={styles.promisesContainer}>
            {promises.map((promise, index) => (
              <Animated.View
                key={promise.key}
                style={[
                  styles.promiseItem,
                  {
                    opacity: fadeAnim,
                    transform: [
                      { translateY: slideAnim },
                      { scale: scaleAnim }
                    ],
                  },
                ]}
              >
                <View style={styles.promiseIcon}>
                  <Text style={styles.promiseIconText}>{promise.icon}</Text>
                </View>
                <Text style={styles.promiseText}>
                  {t(`offer.promises.${promise.key}`)} 
                </Text>
              </Animated.View>
            ))}
          </View>
        </Animated.View>

        {/* Section engagement mutuel */}
        <Animated.View 
          style={[
            styles.commitmentContainer,
            {
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.commitmentCard}>
            <Text style={styles.commitmentTitle}>
              {t('offer.commitment.title')}
            </Text>
            <Text style={styles.commitmentText}>
              {t('offer.commitment.message', { firstName })}
            </Text>
          </View>
        </Animated.View>

        {/* Garantie/Confiance */}
        <Animated.View 
          style={[
            styles.guaranteeContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.guaranteeBadge}>
            <Text style={styles.guaranteeIcon}>✨</Text>
            <Text style={styles.guaranteeText}>
              {t('offer.guarantee')}
            </Text>
          </View>
        </Animated.View>
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40, // Plus d'espace nécessaire maintenant que le CTA est intégré
  },
  
  // Header
  headerContainer: {
    alignItems: 'center',
    marginBottom: 24, // Réduit pour économiser l'espace
  },
  greetingText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 22, // Légèrement réduit
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 28,
  },
  insightContainer: {
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  insightText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 24,
  },

  // Proposition
  propositionContainer: {
    marginBottom: 24, // Réduit
  },
  propositionTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 20, // Légèrement réduit
    color: '#FFD700',
    textAlign: 'center',
    marginBottom: 20,
  },
  promisesContainer: {
    gap: 12, // Réduit pour plus de compacité
  },
  promiseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 14, // Légèrement réduit
    padding: 16, // Réduit
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  promiseIcon: {
    width: 44, // Réduit
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    borderWidth: 2,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  promiseIconText: {
    fontSize: 20, // Réduit
  },
  promiseText: {
    flex: 1,
    fontFamily: 'Poppins-SemiBold',
    fontSize: 15, // Légèrement réduit
    color: '#FFFFFF',
    lineHeight: 20,
  },

  // Engagement
  commitmentContainer: {
    marginBottom: 24, // Réduit
  },
  commitmentCard: {
    backgroundColor: 'rgba(76, 217, 100, 0.1)',
    borderRadius: 18,
    padding: 20, // Réduit
    borderWidth: 2,
    borderColor: '#4CD964',
    alignItems: 'center',
  },
  commitmentTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 18, // Réduit
    color: '#4CD964',
    textAlign: 'center',
    marginBottom: 10,
  },
  commitmentText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 15, // Réduit
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 22,
  },

  // Garantie
  guaranteeContainer: {
    alignItems: 'center',
    marginBottom: 24, // Réduit
  },
  guaranteeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.3)',
    marginBottom: 40
  },
  guaranteeIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  guaranteeText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 14,
    color: '#FF6B6B',
  },
});
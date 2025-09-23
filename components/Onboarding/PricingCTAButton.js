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

const { width } = Dimensions.get('window');

export default function PricingCTAButton({ 
  onAccept, 
  triggerHaptic,
  firstName 
}) {
  const { t } = useTranslation();
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    // Animation d'apparition
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();

    // Animation de pulsation continue
    const pulsing = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.02,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    );
    
    // Démarrer la pulsation après 1 seconde
    setTimeout(() => pulsing.start(), 1000);

    return () => pulsing.stop();
  }, []);

  const handlePress = () => {
    triggerHaptic();
    
    // ✅ SUPPRESSION de l'animation fade transparente farfelue
    // Appel direct sans délai ni animation bizarre
    onAccept();
  };

  return (
    <Animated.View 
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [
            { translateY: slideAnim },
            { scale: pulseAnim }
          ],
        },
      ]}
    >
      <View style={styles.ctaWrapper}>
        <TouchableOpacity
          style={styles.ctaButton}
          onPress={handlePress}
          activeOpacity={0.9}
        >
          <View style={styles.ctaContent}>
            <Text style={styles.ctaText}>
              {t('offer.cta.primary')}
            </Text>
            <Text style={styles.ctaSubtext}>
              {t('offer.cta.secondary')}
            </Text>
          </View>
          <View style={styles.ctaArrow}>
            <Text style={styles.ctaArrowText}>→</Text>
          </View>
        </TouchableOpacity>
        
        <Text style={styles.ctaDisclaimer}>
          {t('offer.cta.disclaimer')}
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingBottom: 34,
  },
  ctaWrapper: {
    backgroundColor: 'rgba(30, 30, 46, 0.95)',
    borderRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  ctaButton: {
    backgroundColor: '#FFD700',
    borderRadius: 18,
    paddingVertical: 18,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
    marginBottom: 12,
  },
  ctaContent: {
    flex: 1,
  },
  ctaText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 19,
    color: '#000',
    marginBottom: 2,
  },
  ctaSubtext: {
    fontFamily: 'Poppins-Medium',
    fontSize: 13,
    color: 'rgba(0, 0, 0, 0.7)',
  },
  ctaArrow: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 16,
  },
  ctaArrowText: {
    fontSize: 18,
    color: '#000',
    fontWeight: 'bold',
  },
  ctaDisclaimer: {
    fontFamily: 'Poppins-Regular',
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    lineHeight: 15,
  },
});
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Image,
  StatusBar,
  Vibration,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import HapticFeedback from 'react-native-haptic-feedback';
import StarryBackground from '../components/Welcome/StarryBackground';
import CompactQuote from '../components/Welcome/QuoteSection';
import CompactStats from '../components/Welcome/ProductivityStats';
import FloatingTestimonials from '../components/Welcome/TestimonialCarousel';
import LanguageSelector from '../components/LanguageSelector';

const { width, height } = Dimensions.get('window');

export default function WelcomePage({ onStartQuiz }) {
  const { t } = useTranslation();

  const startQuiz = () => {
    const options = {
      enableVibrateFallback: true,
      ignoreAndroidSystemSettings: false,
      ignoreIOSSystemSettings: false
    };
    
    // Option 1: Selection (plus doux que impactLight)
    HapticFeedback.trigger('soft', options);
    
    onStartQuiz();
  };

  const testHaptics = () => {
    console.log('🔴 TEST HAPTICS');
    
    const options = {
      enableVibrateFallback: true,
      ignoreAndroidSystemSettings: false,
      ignoreIOSSystemSettings: false
    };
    
    // Test plusieurs types d'haptic
    setTimeout(() => {
      console.log('🟡 impactLight');
      HapticFeedback.trigger('impactLight', options);
    }, 0);
    
    setTimeout(() => {
      console.log('🟠 impactMedium');
      HapticFeedback.trigger('impactMedium', options);
    }, 500);
    
    setTimeout(() => {
      console.log('🔴 impactHeavy');
      HapticFeedback.trigger('impactHeavy', options);
    }, 1000);
    
    setTimeout(() => {
      console.log('✅ notificationSuccess');
      HapticFeedback.trigger('notificationSuccess', options);
    }, 1500);
    
    setTimeout(() => {
      console.log('❌ notificationError');
      HapticFeedback.trigger('notificationError', options);
    }, 2000);
  };

  const testVibration = () => {
    console.log('🔴 TEST VIBRATION NATIVE');
    Vibration.vibrate([100, 100, 100, 100, 100]);
  };

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <StarryBackground>
        {/* ✅ NOUVEAU: Sélecteur de langue en haut à droite */}
        <View style={styles.languageContainer}>
          <LanguageSelector 
            size="medium"
            showFlag={true}
            showText={true}
            style={styles.languageSelector}
          />
        </View>

        {/* Image de l'immeuble par-dessus le ciel étoilé */}
        <Image
          source={require('../assets/images/immobili.png')}
          style={styles.buildingImage}
          resizeMode="contain"
        />

        {/* Logo HABITUS centré à 8% du haut */}
        <View style={styles.logoContainer}>
          <Text style={styles.logo}>{t('common.appName')}</Text>
          <Text style={styles.sublogo}>{t('welcome.quote.text')}</Text>
          <Text style={styles.sublogo}>{t('welcome.quote.author')}</Text>
        </View>

        {/* Citation compacte juste sous le logo */}
        <View style={styles.quoteContainer}>
          <CompactQuote />
        </View>

        {/* Stats de productivité en overlay compact */}
        <View style={styles.statsContainer}>
          <CompactStats />
        </View>

        {/* Témoignages flottants minimalistes */}
        <FloatingTestimonials />

        {/* Section principale avec texte et CTA */}
        <View style={styles.mainContent}>
          <View style={styles.welcomeSection}>
            <Text style={styles.title}>{t('welcome.cta.title')}</Text>
           
            <Text style={styles.subtitle}>
              {t('welcome.cta.subtitle')}
            </Text>
          </View>

          {/* Bouton CTA compact */}
          <TouchableOpacity 
            style={styles.ctaButton} 
            onPress={startQuiz}
            activeOpacity={0.9}
          >
            <Text style={styles.ctaText}>{t('welcome.cta.button')}</Text>
            <View style={styles.arrowContainer}>
              <Text style={styles.arrow}>→</Text>
            </View>
          </TouchableOpacity>
        </View>

      </StarryBackground>
    </>
  );
}

const styles = StyleSheet.create({
  // ✅ NOUVEAU: Styles pour le sélecteur de langue
  languageContainer: {
    position: 'absolute',
    top: height * 0.06,
    right: 20,
    zIndex: 15, // Au-dessus de tout
  },
  languageSelector: {
    // Style personnalisé pour ce contexte
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },

  buildingImage: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    width: width,
    height: height * 0.65, // Légèrement réduit pour libérer de l'espace
    zIndex: 1,
  },
  logoContainer: {
    position: 'absolute',
    top: height * 0.08,
    width: '100%',
    alignItems: 'center',
    zIndex: 10,
  },
  logo: {
    fontFamily: 'Poppins-Bold',
    fontSize: 34,
    color: '#FFFFFF',
    letterSpacing: 2,
    textShadowColor: 'rgba(255, 255, 255, 0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  sublogo: {
    fontFamily: 'Poppins-Bold',
    fontSize: 10,
    color: '#FFFFFF',
    letterSpacing: 2,
    textShadowColor: 'rgba(255, 255, 255, 0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
    fontStyle: 'italic',
    marginTop: 10
  },
  quoteContainer: {
    position: 'absolute',
    top: height * 0.15,
    width: '100%',
    alignItems: 'center',
    zIndex: 9,
  },
  statsContainer: {
    position: 'absolute',
    top: height * 0.25,
    right: '5%',
    zIndex: 8,
  },
  mainContent: {
    position: 'absolute',
    bottom: height * 0.09, // Descendu de 0.15 à 0.08 pour être plus bas
    left: '6%',
    right: '6%',
    zIndex: 10,
  },
  welcomeSection: {
    marginBottom: 24,
  },
  title: {
    fontFamily: 'Poppins-Bold',
    fontSize: 28,
    color: '#FFFFFF',
    marginBottom: 8,
  },
  description: {
    fontFamily: 'Poppins-Medium',
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 6,
  },
  highlight: {
    fontFamily: 'Poppins-Bold',
    color: '#FFD700',
    textShadowColor: 'rgba(255, 215, 0, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
  subtitle: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 20,
    width: '63%', // Contraint à 60% de la largeur du conteneur parent
  },
  ctaButton: {
    backgroundColor: '#FFD700',
    borderRadius: 25,
    paddingVertical: 16,
    paddingHorizontal: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-end',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 2,
    borderColor: '#FFA500',
  },
  ctaText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 16,
    color: '#1A1A1A',
    marginRight: 8,
  },
  arrowContainer: {
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrow: {
    fontSize: 14,
    color: '#1A1A1A',
    fontWeight: 'bold',
  },
  progressContainer: {
    position: 'absolute',
    bottom: height * 0.08,
    width: '100%',
    alignItems: 'center',
    zIndex: 10,
  },
  progressDots: {
    flexDirection: 'row',
  },
  progressDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 3,
  },
  activeDot: {
    backgroundColor: '#FFD700',
    width: 18,
  },
});
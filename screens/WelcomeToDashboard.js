// FICHIER: ./screens/WelcomeToDashboard.js (REMPLACER COMPLÈTEMENT)

import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  StatusBar,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import HapticFeedback from 'react-native-haptic-feedback';
import StarryBackground from '../components/Welcome/StarryBackground';
import AppleSignInStep from '../components/WelcomeToDashboard/AppleSignInStep';
import RatingStep from '../components/WelcomeToDashboard/RatingStep';

const { width, height } = Dimensions.get('window');

// Énumération des étapes
const STEPS = {
  CONGRATULATIONS: 'congratulations',
  APPLE_SIGNIN: 'apple_signin',
  RATING: 'rating',
  COMPLETING: 'completing',
};

export default function WelcomeToDashboard({ onComplete, onboardingData }) {
  const { t } = useTranslation();
  
  // États du flow
  const [currentStep, setCurrentStep] = useState(STEPS.CONGRATULATIONS);
  const [appleSignInData, setAppleSignInData] = useState(null);
  const [ratingData, setRatingData] = useState(null);
  
  // États pour l'animation des félicitations
  const [showFireworks, setShowFireworks] = useState(true);
  const [showContent, setShowContent] = useState(false);
  
  // Animations pour le feu d'artifice (étape 1)
  const firework1 = useRef(new Animated.Value(0)).current;
  const firework2 = useRef(new Animated.Value(0)).current;
  const firework3 = useRef(new Animated.Value(0)).current;
  const firework4 = useRef(new Animated.Value(0)).current;
  const firework5 = useRef(new Animated.Value(0)).current;
  
  // Animations pour le contenu
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(100)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Animation spectaculaire d'entrée (étape félicitations)
  useEffect(() => {
    if (currentStep === STEPS.CONGRATULATIONS) {
      startCongratulationsAnimation();
    }
  }, [currentStep]);

  const startCongratulationsAnimation = () => {
    // Séquence de feu d'artifice
    const fireworksSequence = () => {
      return Animated.parallel([
        // Feu d'artifice 1 (centre haut)
        Animated.sequence([
          Animated.timing(firework1, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(firework1, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
        ]),
        // Feu d'artifice 2 (gauche) avec délai
        Animated.sequence([
          Animated.delay(200),
          Animated.timing(firework2, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(firework2, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]),
        // Feu d'artifice 3 (droite) avec délai
        Animated.sequence([
          Animated.delay(400),
          Animated.timing(firework3, {
            toValue: 1,
            duration: 700,
            useNativeDriver: true,
          }),
          Animated.timing(firework3, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
        ]),
        // Feu d'artifice 4 (centre bas) avec délai
        Animated.sequence([
          Animated.delay(600),
          Animated.timing(firework4, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(firework4, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]),
        // Feu d'artifice 5 (final) avec délai
        Animated.sequence([
          Animated.delay(800),
          Animated.timing(firework5, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(firework5, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
        ]),
      ]);
    };

    // Lancer le feu d'artifice
    fireworksSequence().start(() => {
      // Masquer le feu d'artifice et afficher le contenu
      setTimeout(() => {
        setShowFireworks(false);
        setShowContent(true);
        
        // Animation du contenu principal
        Animated.sequence([
          // Fade et scale initial
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

        // Animation de pulsation continue
        const pulsing = Animated.loop(
          Animated.sequence([
            Animated.timing(pulseAnim, {
              toValue: 1.05,
              duration: 2000,
              useNativeDriver: true,
            }),
            Animated.timing(pulseAnim, {
              toValue: 1,
              duration: 2000,
              useNativeDriver: true,
            }),
          ])
        );
        
        setTimeout(() => pulsing.start(), 1000);
      }, 500);
    });
  };

  // Fonction de feedback haptique
  const triggerHapticFeedback = () => {
    const options = {
      enableVibrateFallback: true,
      ignoreAndroidSystemSettings: false,
      ignoreIOSSystemSettings: false
    };
    HapticFeedback.trigger('selection', options);
  };

  // Reset des animations pour les transitions entre étapes
  const resetAnimations = () => {
    fadeAnim.setValue(0);
    slideAnim.setValue(100);
    scaleAnim.setValue(0.8);
    showFireworks && setShowFireworks(false);
    showContent && setShowContent(false);
  };

  // HANDLERS POUR LES ÉTAPES

  // Étape 1 -> 2 : Félicitations -> Apple Sign-in
  const handleCongratulationsContinue = () => {
    triggerHapticFeedback();
    
    // Animation de feedback
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 300,
        friction: 10,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setTimeout(() => {
        resetAnimations();
        setCurrentStep(STEPS.APPLE_SIGNIN);
      }, 200);
    });
  };

  // Étape 2 : Apple Sign-in terminé
  const handleAppleSignInComplete = (appleUserData) => {
    console.log('✅ Apple Sign-in complété:', appleUserData);
    setAppleSignInData(appleUserData);
    setCurrentStep(STEPS.RATING);
  };

  // Étape 2 : Apple Sign-in sauté
  const handleAppleSignInSkip = () => {
    console.log('⏭️ Apple Sign-in sauté');
    setCurrentStep(STEPS.RATING);
  };

  // Étape 3 : Rating terminé
  const handleRatingComplete = (stars, isFiveStars) => {
    console.log('✅ Rating complété:', stars, 'étoiles, 5★:', isFiveStars);
    setRatingData({ stars, isFiveStars });
    setCurrentStep(STEPS.COMPLETING);
    
    // Finaliser après un délai
    setTimeout(() => {
      finalizeDashboardEntry();
    }, 1000);
  };

  // Étape 3 : Rating sauté
  const handleRatingSkip = () => {
    console.log('⏭️ Rating sauté');
    setCurrentStep(STEPS.COMPLETING);
    
    // Finaliser après un délai
    setTimeout(() => {
      finalizeDashboardEntry();
    }, 500);
  };

  // Finalisation : Aller au Dashboard
  const finalizeDashboardEntry = () => {
    console.log('🏠 Finalisation - Accès au Dashboard');
    console.log('📊 Données collectées:', {
      onboardingData,
      appleSignIn: appleSignInData,
      rating: ratingData,
    });
    
    // Appeler le callback avec toutes les données
    onComplete?.({
      onboardingData,
      appleSignInData,
      ratingData,
      completedAt: new Date().toISOString(),
    });
  };

  // Obtenir le prénom depuis l'onboarding
  const firstName = onboardingData?.[1] || 'Champion';

  // Composant Feu d'artifice (pour l'étape félicitations)
  const Firework = ({ animValue, style, colors }) => (
    <Animated.View
      style={[
        styles.firework,
        style,
        {
          opacity: animValue,
          transform: [
            {
              scale: animValue.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [0, 1.5, 2.5],
              }),
            },
          ],
        },
      ]}
    >
      {colors.map((color, index) => (
        <Animated.View
          key={index}
          style={[
            styles.fireworkParticle,
            {
              backgroundColor: color,
              transform: [
                {
                  translateX: animValue.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, (Math.cos((index * 360) / colors.length * Math.PI / 180) * 50)],
                  }),
                },
                {
                  translateY: animValue.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, (Math.sin((index * 360) / colors.length * Math.PI / 180) * 50)],
                  }),
                },
              ],
            },
          ]}
        />
      ))}
    </Animated.View>
  );

  // RENDU SELON L'ÉTAPE ACTUELLE

  // Étape 1 : Félicitations
  if (currentStep === STEPS.CONGRATULATIONS) {
    return (
      <>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        <StarryBackground>
          {/* Feu d'artifice */}
          {showFireworks && (
            <View style={styles.fireworksContainer}>
              <Firework 
                animValue={firework1} 
                style={styles.firework1} 
                colors={['#FFD700', '#FF6B6B', '#4CD964', '#FF9500']} 
              />
              <Firework 
                animValue={firework2} 
                style={styles.firework2} 
                colors={['#FF6B6B', '#4CD964', '#FFD700', '#FF9500']} 
              />
              <Firework 
                animValue={firework3} 
                style={styles.firework3} 
                colors={['#4CD964', '#FFD700', '#FF6B6B', '#FF9500']} 
              />
              <Firework 
                animValue={firework4} 
                style={styles.firework4} 
                colors={['#FF9500', '#FFD700', '#4CD964', '#FF6B6B']} 
              />
              <Firework 
                animValue={firework5} 
                style={styles.firework5} 
                colors={['#FFD700', '#FF6B6B', '#4CD964', '#FF9500', '#FFFFFF']} 
              />
            </View>
          )}

          {/* Contenu principal */}
          {showContent && (
            <Animated.View 
              style={[
                styles.container,
                {
                  opacity: fadeAnim,
                  transform: [{ scale: scaleAnim }],
                },
              ]}
            >
              {/* Logo */}
              <View style={styles.header}>
                <Text style={styles.logo}>{t('common.appName')}</Text>
              </View>

              {/* Contenu principal */}
              <Animated.View 
                style={[
                  styles.content,
                  {
                    transform: [{ translateY: slideAnim }],
                  },
                ]}
              >
                {/* Emoji de célébration */}
                <Animated.View 
                  style={[
                    styles.celebrationEmoji,
                    { transform: [{ scale: pulseAnim }] },
                  ]}
                >
                  <Text style={styles.celebrationEmojiText}>🎉</Text>
                </Animated.View>

                {/* Message de félicitations */}
                <Text style={styles.congratsTitle}>
                  Félicitations {firstName} !
                </Text>
                
                <Text style={styles.congratsSubtitle}>
                  Votre profil Habitus est maintenant configuré et prêt à vous accompagner dans l'atteinte de vos objectifs.
                </Text>
              </Animated.View>

              {/* Bouton d'action */}
              <Animated.View 
                style={[
                  styles.footer,
                  {
                    transform: [{ translateY: slideAnim }],
                  },
                ]}
              >
                <TouchableOpacity
                  style={styles.continueButton}
                  onPress={handleCongratulationsContinue}
                  activeOpacity={0.9}
                >
                  <Text style={styles.continueButtonText}>
                    Continuer
                  </Text>
                  <Text style={styles.continueButtonIcon}>🚀</Text>
                </TouchableOpacity>
                
                <Text style={styles.footerText}>
                  Encore quelques étapes pour optimiser votre expérience ! 
                </Text>
              </Animated.View>
            </Animated.View>
          )}
        </StarryBackground>
      </>
    );
  }

  // Étape 2 : Apple Sign-in
  if (currentStep === STEPS.APPLE_SIGNIN) {
    return (
      <>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        <StarryBackground>
          <AppleSignInStep
            firstName={firstName}
            onSkip={handleAppleSignInSkip}
            onComplete={handleAppleSignInComplete}
            triggerHaptic={triggerHapticFeedback}
          />
        </StarryBackground>
      </>
    );
  }

  // Étape 3 : Demande d'avis
  if (currentStep === STEPS.RATING) {
    return (
      <>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        <StarryBackground>
          <RatingStep
            firstName={firstName}
            onSkip={handleRatingSkip}
            onComplete={handleRatingComplete}
            triggerHaptic={triggerHapticFeedback}
          />
        </StarryBackground>
      </>
    );
  }

  // Étape 4 : Finalisation
  if (currentStep === STEPS.COMPLETING) {
    return (
      <>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        <StarryBackground>
          <View style={styles.completingContainer}>
            <Text style={styles.completingIcon}>✨</Text>
            <Text style={styles.completingText}>Finalisation...</Text>
          </View>
        </StarryBackground>
      </>
    );
  }

  // Fallback
  return null;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  
  // Feu d'artifice (étape félicitations)
  fireworksContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  firework: {
    position: 'absolute',
    width: 100,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  firework1: {
    top: height * 0.2,
    left: width * 0.4,
  },
  firework2: {
    top: height * 0.15,
    left: width * 0.1,
  },
  firework3: {
    top: height * 0.25,
    right: width * 0.1,
  },
  firework4: {
    top: height * 0.4,
    left: width * 0.3,
  },
  firework5: {
    top: height * 0.3,
    left: width * 0.45,
  },
  fireworkParticle: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  
  // Header (étape félicitations)
  header: {
    paddingTop: height * 0.08,
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    fontFamily: 'Poppins-Bold',
    fontSize: 28,
    color: '#FFFFFF',
    letterSpacing: 2,
    textShadowColor: 'rgba(255, 255, 255, 0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // Celebration (étape félicitations)
  celebrationEmoji: {
    marginBottom: 30,
  },
  celebrationEmojiText: {
    fontSize: 80,
    textAlign: 'center',
  },
  
  // Félicitations (étape félicitations)
  congratsTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 26,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 15,
    lineHeight: 32,
  },
  congratsSubtitle: {
    fontFamily: 'Poppins-Regular',
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
  },

  // Footer (étape félicitations)
  footer: {
    paddingBottom: 40,
    alignItems: 'center',
  },
  continueButton: {
    backgroundColor: '#FFD700',
    borderRadius: 20,
    paddingVertical: 18,
    paddingHorizontal: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
    marginBottom: 15,
    minWidth: width * 0.7,
  },
  continueButtonText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 20,
    color: '#000000',
    marginRight: 10,
  },
  continueButtonIcon: {
    fontSize: 22,
  },
  footerText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
  },

  // Completing (étape finalisation)
  completingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completingIcon: {
    fontSize: 60,
    marginBottom: 20,
  },
  completingText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 20,
    color: '#FFFFFF',
    textAlign: 'center',
  },
});
// FICHIER: ./components/WelcomeToDashboard/AppleSignInStep.js

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { AuthService } from '../../services/authService';

const { width } = Dimensions.get('window');

export default function AppleSignInStep({ firstName, onSkip, onComplete, triggerHaptic }) {
  const { t } = useTranslation();
  
  const [isLoading, setIsLoading] = useState(false);
  const [showAppleButton, setShowAppleButton] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    checkAppleAvailability();
    startAnimations();
  }, []);

  const checkAppleAvailability = async () => {
    try {
      const isAvailable = await AuthService.isAppleSignInAvailable();
      setShowAppleButton(isAvailable);
      
      if (!isAvailable && Platform.OS === 'ios') {
        setErrorMessage('Apple Sign-In non disponible sur cet appareil');
      }
    } catch (error) {
      console.error('Erreur vérification Apple:', error);
      setShowAppleButton(false);
    }
  };

  const startAnimations = () => {
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
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleAppleSignIn = async () => {
    if (isLoading) return;
    
    triggerHaptic?.();
    setIsLoading(true);
    setErrorMessage('');

    try {
      console.log('🍎 Début Apple Sign-In...');
      const result = await AuthService.linkAppleAccount();

      if (result.success) {
        console.log('✅ Apple Sign-In réussi:', result.user);
        
        // Animation de succès
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.1,
            duration: 150,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 150,
            useNativeDriver: true,
          }),
        ]).start();

        // Attendre un peu pour l'UX puis continuer
        setTimeout(() => {
          onComplete?.(result.user);
        }, 500);

      } else {
        console.log('❌ Apple Sign-In échoué:', result.error);
        
        if (result.error === 'canceled') {
          // L'utilisateur a annulé, pas d'erreur à afficher
          setErrorMessage('');
        } else {
          setErrorMessage(result.message || 'Erreur lors de la connexion Apple');
        }
      }
    } catch (error) {
      console.error('Erreur Apple Sign-In:', error);
      setErrorMessage('Une erreur inattendue s\'est produite');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    triggerHaptic?.();
    
    // Animation de sortie
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      onSkip?.();
    });
  };

  // Si Apple Sign-In n'est pas disponible, passer automatiquement
  if (Platform.OS !== 'ios' || !showAppleButton) {
    setTimeout(() => onSkip?.(), 100);
    return null;
  }

  return (
    <Animated.View 
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [
            { translateY: slideAnim },
            { scale: scaleAnim }
          ],
        },
      ]}
    >
      {/* Icon */}
      <View style={styles.iconContainer}>
        <Text style={styles.icon}>🍎</Text>
      </View>

      {/* Title & Description */}
      <Text style={styles.title}>
        Sauvegardez vos données
      </Text>
      
      <Text style={styles.description}>
        {firstName}, reliez votre compte Apple pour synchroniser vos données entre vos appareils et ne jamais les perdre.
      </Text>

      {/* Benefits */}
      <View style={styles.benefitsContainer}>
        <View style={styles.benefitItem}>
          <Text style={styles.benefitIcon}>☁️</Text>
          <Text style={styles.benefitText}>Sauvegarde automatique</Text>
        </View>
        <View style={styles.benefitItem}>
          <Text style={styles.benefitIcon}>📱</Text>
          <Text style={styles.benefitText}>Sync multi-appareils</Text>
        </View>
        <View style={styles.benefitItem}>
          <Text style={styles.benefitIcon}>🔒</Text>
          <Text style={styles.benefitText}>100% sécurisé</Text>
        </View>
      </View>

      {/* Error Message */}
      {errorMessage ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{errorMessage}</Text>
        </View>
      ) : null}

      {/* Buttons */}
      <View style={styles.buttonsContainer}>
        {/* Apple Sign-In Button */}
        <TouchableOpacity
          style={[styles.appleButton, isLoading && styles.appleButtonDisabled]}
          onPress={handleAppleSignIn}
          disabled={isLoading}
          activeOpacity={0.8}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Text style={styles.appleIcon}>🍎</Text>
              <Text style={styles.appleButtonText}>
                Continuer avec Apple
              </Text>
            </>
          )}
        </TouchableOpacity>

        {/* Skip Button */}
        <TouchableOpacity
          style={styles.skipButton}
          onPress={handleSkip}
          disabled={isLoading}
          activeOpacity={0.7}
        >
          <Text style={styles.skipButtonText}>
            Plus tard
          </Text>
        </TouchableOpacity>
      </View>

      {/* Footer note */}
      <Text style={styles.footerNote}>
        Cette étape est optionnelle et peut être configurée plus tard dans les paramètres.
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  
  // Icon
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
  },
  icon: {
    fontSize: 40,
  },

  // Text Content
  title: {
    fontFamily: 'Poppins-Bold',
    fontSize: 24,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 15,
  },
  description: {
    fontFamily: 'Poppins-Regular',
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },

  // Benefits
  benefitsContainer: {
    marginBottom: 30,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  benefitIcon: {
    fontSize: 16,
    marginRight: 12,
    width: 20,
  },
  benefitText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },

  // Error
  errorContainer: {
    backgroundColor: 'rgba(255, 107, 107, 0.2)',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.3)',
  },
  errorText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 13,
    color: '#FF6B6B',
    textAlign: 'center',
  },

  // Buttons
  buttonsContainer: {
    width: '100%',
    marginBottom: 20,
  },
  appleButton: {
    backgroundColor: '#000000',
    borderRadius: 12,
    paddingVertical: 15,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  appleButtonDisabled: {
    opacity: 0.6,
  },
  appleIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  appleButtonText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  skipButton: {
    backgroundColor: 'transparent',
    borderRadius: 12,
    paddingVertical: 15,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  skipButtonText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },

  // Footer
  footerNote: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    lineHeight: 16,
  },
});
// FICHIER: ./components/WelcomeToDashboard/RatingStep.js

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { RatingService } from '../../services/ratingService';

const { width } = Dimensions.get('window');

export default function RatingStep({ firstName, onSkip, onComplete, triggerHaptic }) {
  const { t } = useTranslation();
  
  const [isLoading, setIsLoading] = useState(false);
  const [selectedStars, setSelectedStars] = useState(0);
  const [showThankYou, setShowThankYou] = useState(false);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const starsAnimations = useRef([...Array(5)].map(() => new Animated.Value(0))).current;
  const thankYouAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    startAnimations();
  }, []);

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
    ]).start(() => {
      // Animer les étoiles une par une
      animateStars();
    });
  };

  const animateStars = () => {
    const animations = starsAnimations.map((anim, index) =>
      Animated.sequence([
        Animated.delay(index * 100),
        Animated.spring(anim, {
          toValue: 1,
          tension: 150,
          friction: 8,
          useNativeDriver: true,
        }),
      ])
    );

    Animated.parallel(animations).start();
  };

  const handleStarPress = (starIndex) => {
    triggerHaptic?.();
    const rating = starIndex + 1;
    setSelectedStars(rating);

    // Animation de sélection
    Animated.sequence([
      Animated.timing(starsAnimations[starIndex], {
        toValue: 1.3,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(starsAnimations[starIndex], {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();

    console.log(`⭐ Utilisateur a sélectionné ${rating} étoiles`);
  };

  const handleSubmitRating = async () => {
    if (selectedStars === 0 || isLoading) return;
    
    triggerHaptic?.();
    setIsLoading(true);

    try {
      if (selectedStars === 5) {
        // 5 étoiles : Ouvrir l'App Store
        console.log('🌟 5 étoiles ! Redirection App Store...');
        
        const result = await RatingService.openAppStoreForRating();
        
        if (result.success) {
          // Afficher remerciement et continuer
          showThankYouMessage();
        } else {
          console.error('Erreur ouverture App Store:', result.error);
          // Continuer quand même avec remerciement
          showThankYouMessage();
        }
      } else {
        // Moins de 5 étoiles : Juste remercier et expliquer
        console.log(`⭐ ${selectedStars} étoiles - Pas de redirection App Store`);
        await RatingService.markRatingGiven();
        showThankYouMessage(false); // false = pas 5 étoiles
      }
    } catch (error) {
      console.error('Erreur submit rating:', error);
      showThankYouMessage();
    } finally {
      setIsLoading(false);
    }
  };

  const showThankYouMessage = (isFiveStars = true) => {
    setShowThankYou(true);
    
    // Animation de remerciement
    Animated.sequence([
      Animated.timing(thankYouAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.delay(2000), // Attendre 2 secondes
    ]).start(() => {
      // Continuer vers l'étape suivante
      onComplete?.(selectedStars, isFiveStars);
    });
  };

  const handleSkip = () => {
    triggerHaptic?.();
    
    // Marquer comme refusé
    RatingService.markRatingDeclined();
    
    // Animation de sortie
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      onSkip?.();
    });
  };

  const renderStars = () => {
    return (
      <View style={styles.starsContainer}>
        {[...Array(5)].map((_, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => handleStarPress(index)}
            disabled={isLoading || showThankYou}
            activeOpacity={0.7}
          >
            <Animated.Text
              style={[
                styles.star,
                {
                  transform: [{ scale: starsAnimations[index] }],
                },
                selectedStars > index && styles.starSelected,
              ]}
            >
              ⭐
            </Animated.Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderThankYou = () => (
    <Animated.View
      style={[
        styles.thankYouContainer,
        {
          opacity: thankYouAnim,
          transform: [{
            scale: thankYouAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0.8, 1],
            }),
          }],
        },
      ]}
    >
      <Text style={styles.thankYouIcon}>🙏</Text>
      <Text style={styles.thankYouTitle}>
        {selectedStars === 5 ? 'Merci beaucoup !' : 'Merci pour votre retour !'}
      </Text>
      <Text style={styles.thankYouSubtitle}>
        {selectedStars === 5 
          ? 'Votre avis 5 étoiles nous aide énormément !' 
          : 'Nous travaillons pour améliorer l\'expérience.'
        }
      </Text>
    </Animated.View>
  );

  if (showThankYou) {
    return (
      <View style={styles.container}>
        {renderThankYou()}
      </View>
    );
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
        <Text style={styles.icon}>⭐</Text>
      </View>

      {/* Title & Description */}
      <Text style={styles.title}>
        Vous aimez Habitus ?
      </Text>
      
      <Text style={styles.description}>
        {firstName}, votre avis compte énormément ! Une note de 5 étoiles fait toute la différence pour notre référencement.
      </Text>

      {/* Important Note */}
      <View style={styles.importantNote}>
        <Text style={styles.importantIcon}>💡</Text>
        <Text style={styles.importantText}>
          <Text style={styles.importantTextBold}>Important :</Text> Les notes de 1-4 étoiles sont considérées comme "médiocres" par l'App Store et nuisent à notre visibilité.
        </Text>
      </View>

      {/* Stars Rating */}
      {renderStars()}

      {/* Selected rating text */}
      {selectedStars > 0 && (
        <Text style={styles.ratingText}>
          {selectedStars === 5 
            ? "🌟 Parfait ! Merci de nous soutenir !" 
            : selectedStars >= 4 
            ? "👍 Bien ! Comment peut-on s'améliorer ?"
            : "😔 Nous pouvons faire mieux..."
          }
        </Text>
      )}

      {/* Buttons */}
      <View style={styles.buttonsContainer}>
        {/* Submit Button */}
        {selectedStars > 0 && (
          <TouchableOpacity
            style={[
              styles.submitButton,
              selectedStars === 5 && styles.submitButtonFive,
              isLoading && styles.submitButtonDisabled
            ]}
            onPress={handleSubmitRating}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Text style={styles.submitButtonText}>
                  {selectedStars === 5 ? 'Noter sur l\'App Store' : 'Envoyer mon avis'}
                </Text>
                <Text style={styles.submitButtonIcon}>
                  {selectedStars === 5 ? '🏪' : '📤'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        )}

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
        Votre avis nous aide à améliorer l'app et à aider plus de personnes à atteindre leurs objectifs.
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
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
    borderWidth: 2,
    borderColor: 'rgba(255, 215, 0, 0.4)',
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
    marginBottom: 20,
  },

  // Important Note
  importantNote: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderRadius: 12,
    padding: 15,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  importantIcon: {
    fontSize: 16,
    marginRight: 10,
    marginTop: 2,
  },
  importantText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 18,
    flex: 1,
  },
  importantTextBold: {
    fontFamily: 'Poppins-Bold',
    color: '#FFD700',
  },

  // Stars
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
    gap: 8,
  },
  star: {
    fontSize: 32,
    opacity: 0.4,
    paddingHorizontal: 5,
    paddingVertical: 10,
  },
  starSelected: {
    opacity: 1,
  },

  // Rating Text
  ratingText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 14,
    color: '#FFD700',
    textAlign: 'center',
    marginBottom: 25,
  },

  // Buttons
  buttonsContainer: {
    width: '100%',
    marginBottom: 20,
  },
  submitButton: {
    backgroundColor: '#4CD964',
    borderRadius: 12,
    paddingVertical: 15,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
    shadowColor: '#4CD964',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  submitButtonFive: {
    backgroundColor: '#FFD700',
    shadowColor: '#FFD700',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
    color: '#000000',
    marginRight: 8,
  },
  submitButtonIcon: {
    fontSize: 16,
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

  // Thank You
  thankYouContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  thankYouIcon: {
    fontSize: 60,
    marginBottom: 20,
  },
  thankYouTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 24,
    color: '#FFD700',
    textAlign: 'center',
    marginBottom: 10,
  },
  thankYouSubtitle: {
    fontFamily: 'Poppins-Regular',
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 24,
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
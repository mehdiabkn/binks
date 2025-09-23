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

export default function NavigationButtons({
  canGoBack,
  canGoNext,
  isLastQuestion,
  isPricingScreen,
  isInfoScreen,
  onPrevious,
  onNext,
  triggerHaptic,
  currentQuestion, // ✅ Ajouté pour connaître la question actuelle
  allAnswers,     // ✅ Ajouté pour accéder aux réponses
  onReturnToWelcome, // ✅ NOUVEAU: Fonction pour retourner à l'accueil
}) {
  const { t } = useTranslation();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, []);

  // ✅ Fonction pour vérifier si on peut continuer selon le type de question
  const canContinue = () => {
    // Si c'est pas une question MIT/MET, utiliser la logique normale
    if (!currentQuestion) return canGoNext;

    // Pour les questions MIT
    if (currentQuestion.type === 'mit_input') {
      const mitAnswer = allAnswers[currentQuestion.id];
      if (!mitAnswer || !Array.isArray(mitAnswer)) return false;
      
      // Au moins 1 MIT avec du texte
      const filledMits = mitAnswer.filter(mit => mit.text && mit.text.trim() !== '');
      return filledMits.length > 0;
    }

    // Pour les questions MET
    if (currentQuestion.type === 'met_input') {
      const metAnswer = allAnswers[currentQuestion.id];
      if (!metAnswer || !Array.isArray(metAnswer)) return false;
      
      // Au moins 1 MET avec du texte
      const filledMets = metAnswer.filter(met => met.text && met.text.trim() !== '');
      return filledMets.length > 0;
    }

    // Pour les autres types de questions, utiliser la logique normale
    return canGoNext;
  };

  // Masquer les boutons seulement pour l'écran de pricing (il a son propre bouton)
  if (isPricingScreen) {
    return null;
  }

  // ✅ NOUVEAU: Gestion du bouton précédent
  const handlePrevious = () => {
    triggerHaptic();
    
    if (canGoBack) {
      // Navigation normale vers la question précédente
      onPrevious();
    } else {
      // Retour vers WelcomeScreen si on est à la première question
      if (onReturnToWelcome) {
        onReturnToWelcome();
      }
    }
  };

  const handleNext = () => {
    triggerHaptic();
    onNext();
  };

  const canActuallyContinue = canContinue();

  // ✅ NOUVEAU: Texte dynamique pour le bouton précédent
  const getPreviousButtonText = () => {
    if (canGoBack) {
      return `← ${t('common.previous')}`;
    } else {
      return `← ${t('navigation.backToWelcome')}`;
    }
  };

  // ✅ NOUVEAU: Style dynamique pour le bouton précédent
  const getPreviousButtonStyle = () => {
    if (canGoBack) {
      return styles.previousButton; // Style normal
    } else {
      return styles.welcomeButton; // Style spécial pour retour accueil
    }
  };

  return (
    <Animated.View
      style={[
        styles.container,
        { opacity: fadeAnim }
      ]}
    >
      <View style={[
        styles.buttonRow,
        isInfoScreen && styles.centeredButtonRow
      ]}>
        {/* Bouton Précédent / Retour Accueil */}
        <TouchableOpacity
          style={[
            styles.button,
            getPreviousButtonStyle(),
            isInfoScreen && styles.centeredButton,
          ]}
          onPress={handlePrevious}
          activeOpacity={0.8}
        >
          <Text style={[
            styles.buttonText,
            canGoBack ? styles.previousButtonText : styles.welcomeButtonText,
          ]}>
            {getPreviousButtonText()}
          </Text>
        </TouchableOpacity>

        {/* Bouton Suivant/Terminer - masqué pour les écrans d'info car ils ont leur propre bouton */}
        {!isInfoScreen && (
          <TouchableOpacity
            style={[
              styles.button,
              styles.nextButton,
              !canActuallyContinue && styles.disabledNextButton,
            ]}
            onPress={handleNext}
            disabled={!canActuallyContinue}
            activeOpacity={0.8}
          >
            <Text style={[
              styles.buttonText,
              styles.nextButtonText,
              !canActuallyContinue && styles.disabledNextButtonText,
            ]}>
              {isLastQuestion ? `${t('common.finish')} ✨` : `${t('common.next')} →`}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 10,
  },
  centeredButtonRow: {
    justifyContent: 'center',
  },
  centeredButton: {
    alignSelf: 'center',
  },
  button: {
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 20,
    minWidth: width * 0.35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  previousButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  // ✅ NOUVEAU: Style pour le bouton retour accueil
  welcomeButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  nextButton: {
    backgroundColor: '#FFD700',
    shadowColor: '#FFD700',
    shadowOpacity: 0.3,
  },
  disabledButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  disabledNextButton: {
    backgroundColor: 'rgba(255, 215, 0, 0.3)',
    shadowOpacity: 0.1,
  },
  buttonText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
  },
  previousButtonText: {
    color: '#FFFFFF',
  },
  // ✅ NOUVEAU: Style pour le texte du bouton accueil
  welcomeButtonText: {
    color: '#FFFFFF', // Rouge plus visible
  },
  nextButtonText: {
    color: '#000000',
  },
  disabledButtonText: {
    color: 'rgba(255, 255, 255, 0.4)',
  },
  disabledNextButtonText: {
    color: 'rgba(0, 0, 0, 0.4)',
  },
});
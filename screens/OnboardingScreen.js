import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  StatusBar,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import HapticFeedback from 'react-native-haptic-feedback';
import StarryBackground from '../components/Welcome/StarryBackground';
import QuestionCard from '../components/Onboarding/QuestionCard';
import ProgressIndicator from '../components/Onboarding/ProgressIndicator';
import NavigationButtons from '../components/Onboarding/NavigationButtons';
import PricingCTAButton from '../components/Onboarding/PricingCTAButton';
import PaywallModal from '../components/Modals/PaywallModal';

const { width, height } = Dimensions.get('window');

// Structure des questions en JSON pour le nouvel onboarding - INTERNATIONALISÉ
const QUESTIONS_STRUCTURE = [
  {
    id: 1,
    type: 'name_input',
    maxLength: 30
  },
  {
    id: 2,
    type: 'info_screen'
  },
  {
    id: 3,
    type: 'multiple_choice',
    multiSelect: true,
    options: [
      { id: 'scolaires', emoji: "📚" },
      { id: 'sportifs', emoji: "💪" },
      { id: 'business', emoji: "💼" },
      { id: 'personnels', emoji: "🎯" }
    ]
  },
  {
    id: 4,
    type: 'multiple_choice',
    gradeQuestion: true,
    options: [
      { id: 'a_player', emoji: "🥇", gradeValue: 3 },
      { id: 'b_player', emoji: "🥈", gradeValue: 2 },
      { id: 'c_player', emoji: "🥉", gradeValue: 1 }
    ]
  },
  {
    id: 5,
    type: 'multiple_choice',
    gradeQuestion: true,
    dependsOn: 4,
    options: [
      { id: 's_player', emoji: "🏆", gradeValue: 4 },
      { id: 'a_player', emoji: "🥇", gradeValue: 3 },
      { id: 'b_player', emoji: "🥈", gradeValue: 2 }
    ]
  },
  {
    id: 6,
    type: 'multiple_choice',
    options: [
      { id: '3mois', emoji: "⚡" },
      { id: '6mois', emoji: "🎯" },
      { id: '1an', emoji: "📅" },
      { id: '2ans', emoji: "🗓️" }
    ]
  },
  {
    id: 7,
    type: 'multiple_choice',
    options: [
      { id: 'pasloin', emoji: "😐" },
      { id: 'plutotloin', emoji: "😕" },
      { id: 'loin', emoji: "😟" },
      { id: 'abusivementloin', emoji: "😰" }
    ]
  },
  {
    id: 8,
    type: 'info_screen'
  },
  {
    id: 9,
    type: 'text_input',
    maxLength: 300
  },
  {
    id: 10,
    type: 'info_screen'
  },
  {
    id: 11,
    type: 'mit_input',
    maxLength: 200
  },
  {
    id: 12,
    type: 'met_input',
    maxLength: 150
  },
  {
    id: 13,
    type: 'signature'
  },
  {
    id: 14,
    type: 'pricing_screen',
    pricing: {
      monthly: 4.99,
      weekly: 1.49,
      yearly: 49.99
    }
  }
];

export default function OnboardingScreen({ onComplete, onReturnToWelcome }) {
  const { t } = useTranslation();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [isPaywallVisible, setIsPaywallVisible] = useState(false);
  const [isCompletingOnboarding, setIsCompletingOnboarding] = useState(false); // ✅ NOUVEAU

  // ✅ Fonction pour construire une question avec les traductions
  const buildQuestion = (questionStructure) => {
    const questionKey = `onboarding.questions.${questionStructure.id}`;
    const firstName = answers[1] || '';

    let question = {
      ...questionStructure,
      question: t(`${questionKey}.question`, { firstName }),
      subtitle: t(`${questionKey}.subtitle`, { firstName })
    };

    // Ajouter les textes spécifiques selon le type
    if (questionStructure.type === 'info_screen') {
      question.buttonText = t(`${questionKey}.buttonText`);
    }

    if (questionStructure.type === 'name_input' ||
        questionStructure.type === 'text_input' ||
        questionStructure.type === 'mit_input' ||
        questionStructure.type === 'met_input' ||
        questionStructure.type === 'signature') {
      question.placeholder = t(`${questionKey}.placeholder`);
    }

    // Ajouter les traductions des options
    if (questionStructure.options) {
      question.options = questionStructure.options.map(option => ({
        ...option,
        text: t(`onboarding.options.${option.id}`)
      }));
    }

    return question;
  };

  // ✅ Fonction pour filtrer les options selon la logique des grades
  const getFilteredOptions = (questionStructure) => {
    // Si ce n'est pas une question de grade qui dépend d'une autre, retourner toutes les options
    if (!questionStructure.gradeQuestion || !questionStructure.dependsOn) {
      return questionStructure.options;
    }

    // Récupérer la réponse de la question dont elle dépend
    const dependentAnswer = answers[questionStructure.dependsOn];
    if (!dependentAnswer) {
      return questionStructure.options;
    }

    // Trouver la valeur du grade actuel
    const dependentQuestionStructure = QUESTIONS_STRUCTURE.find(q => q.id === questionStructure.dependsOn);
    const selectedOption = dependentQuestionStructure.options.find(opt => opt.id === dependentAnswer);

    if (!selectedOption || !selectedOption.gradeValue) {
      return questionStructure.options;
    }

    const currentGradeValue = selectedOption.gradeValue;

    // Filtrer les options pour ne garder que celles supérieures au grade actuel
    const filteredOptions = questionStructure.options.filter(option => {
      return option.gradeValue > currentGradeValue;
    });

    console.log('Filtrage des grades:');
    console.log('Grade actuel:', currentGradeValue, '(', t(`onboarding.options.${selectedOption.id}`), ')');
    console.log('Options disponibles:', filteredOptions.map(opt => t(`onboarding.options.${opt.id}`)));

    return filteredOptions;
  };

  // ✅ Créer une version modifiée de la question avec les options filtrées et les traductions
  const getCurrentQuestionWithFilteredOptions = () => {
    const questionStructure = QUESTIONS_STRUCTURE[currentQuestionIndex];

    if (questionStructure.gradeQuestion && questionStructure.dependsOn) {
      const filteredOptions = getFilteredOptions(questionStructure);

      // Si aucune option n'est disponible (l'utilisateur est déjà au max)
      if (filteredOptions.length === 0) {
        const firstName = answers[1] || '';
        return {
          ...questionStructure,
          question: t('onboarding.maxLevel.question', { firstName }),
          subtitle: t('onboarding.maxLevel.subtitle'),
          type: 'info_screen',
          buttonText: t('onboarding.maxLevel.buttonText'),
          autoAdvance: true
        };
      }

      // Construire la question avec les options filtrées
      const question = buildQuestion({
        ...questionStructure,
        options: filteredOptions
      });

      return question;
    }

    return buildQuestion(questionStructure);
  };

  // Debug: Log de l'état actuel
  useEffect(() => {
    console.log('=== DEBUG ONBOARDING ===');
    console.log('Question index:', currentQuestionIndex);
    console.log('Question structure:', QUESTIONS_STRUCTURE[currentQuestionIndex]);
    console.log('Réponses:', answers);
    console.log('========================');
  }, [currentQuestionIndex, answers]);

  // ✅ Auto-advance pour les questions où toutes les options sont filtrées
  useEffect(() => {
    const currentQuestion = getCurrentQuestionWithFilteredOptions();
    if (currentQuestion.autoAdvance) {
      // Sauvegarder automatiquement et passer à la suivante
      setTimeout(() => {
        setAnswers(prev => ({
          ...prev,
          [currentQuestion.id]: 'max_level'
        }));

        if (currentQuestionIndex < QUESTIONS_STRUCTURE.length - 1) {
          setCurrentQuestionIndex(prev => prev + 1);
        } else {
          onComplete({
            ...answers,
            [currentQuestion.id]: 'max_level'
          });
        }
      }, 2000); // Attendre 2 secondes avant d'avancer
    }
  }, [currentQuestionIndex, answers]);

  // Fonction de feedback haptique
  const triggerHapticFeedback = () => {
    const options = {
      enableVibrateFallback: true,
      ignoreAndroidSystemSettings: false,
      ignoreIOSSystemSettings: false
    };
    HapticFeedback.trigger('selection', options);
  };

  // Sauvegarder une réponse
  const saveAnswer = (questionId, answer) => {
    console.log('Sauvegarde réponse:', questionId, answer);
    triggerHapticFeedback();
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  // Fonction pour les info_screen
  const handleInfoScreenContinue = () => {
    const currentQuestion = getCurrentQuestionWithFilteredOptions();
    
    // Sauvegarder la réponse pour l'info_screen
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: true
    }));

    // Passer à la question suivante
    if (currentQuestionIndex < QUESTIONS_STRUCTURE.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      // Quiz terminé
      onComplete({
        ...answers,
        [currentQuestion.id]: true
      });
    }
  };

  // ✅ Fonction pour gérer l'acceptation de l'offre pricing - OUVRE LA MODALE
  const handlePricingOfferAccept = () => {
    triggerHapticFeedback();
    console.log('🎯 Ouverture du paywall modal');
    setIsPaywallVisible(true);
  };

  // ✅ Fonction pour fermer la modale paywall
  const handlePaywallClose = () => {
    console.log('❌ Fermeture du paywall modal');
    setIsPaywallVisible(false);
    triggerHapticFeedback();
  };

  // ✅ CORRIGÉ: Fonction pour gérer l'abonnement depuis la modale
  const handlePaywallSubscribe = (selectedPlan) => {
    console.log('💳 Abonnement confirmé:', selectedPlan);
    triggerHapticFeedback();
    
    // ✅ Marquer qu'on est en train de terminer l'onboarding
    setIsCompletingOnboarding(true);
    
    // Sauvegarder les données de l'abonnement
    const updatedAnswers = {
      ...answers,
      [getCurrentQuestionWithFilteredOptions().id]: 'subscribed',
      selectedPlan: selectedPlan,
      subscriptionDate: new Date().toISOString()
    };
    
    // ✅ Terminer directement l'onboarding SANS fermer le modal
    // Le modal va disparaître quand l'écran change
    onComplete(updatedAnswers);
  };

  // Aller à la question suivante
  const goToNextQuestion = () => {
    const currentQuestion = getCurrentQuestionWithFilteredOptions();
    const hasAnswer = answers[currentQuestion.id];

    console.log('goToNextQuestion - Question:', currentQuestion.id, 'Réponse:', hasAnswer);

    // Vérifier si on a une réponse (sauf pour certains types)
    if (!hasAnswer && 
        currentQuestion.type !== 'pricing_screen' && 
        currentQuestion.type !== 'info_screen') {
      console.log('Pas de réponse, arrêt');
      const options = {
        enableVibrateFallback: true,
        ignoreAndroidSystemSettings: false,
        ignoreIOSSystemSettings: false
      };
      HapticFeedback.trigger('notificationError', options);
      return;
    }

    if (currentQuestionIndex < QUESTIONS_STRUCTURE.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      // Quiz terminé
      onComplete(answers);
    }
  };

  // Revenir à la question précédente
  const goToPreviousQuestion = () => {
    if (currentQuestionIndex === 0) return;
    triggerHapticFeedback();
    setCurrentQuestionIndex(prev => prev - 1);
  };

  // Variables pour le rendu
  const currentQuestion = getCurrentQuestionWithFilteredOptions();
  const progress = (currentQuestionIndex + 1) / QUESTIONS_STRUCTURE.length;
  const isLastQuestion = currentQuestionIndex === QUESTIONS_STRUCTURE.length - 1;
  const isInfoScreen = currentQuestion.type === 'info_screen';
  const isPricingScreen = currentQuestion.type === 'pricing_screen';
  const firstName = answers[1] || '';

  // Vérification des données avant rendu
  if (!currentQuestion) {
    console.error('Aucune question trouvée pour l\'index:', currentQuestionIndex);
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Erreur: Question non trouvée</Text>
      </View>
    );
  }

  // ✅ Si on est en train de terminer l'onboarding, ne pas afficher l'interface normale
  if (isCompletingOnboarding) {
    return (
      <StarryBackground>
        <PaywallModal
          isVisible={isPaywallVisible}
          onClose={handlePaywallClose}
          onSubscribe={handlePaywallSubscribe}
          firstName={firstName}
          triggerHaptic={triggerHapticFeedback}
        />
      </StarryBackground>
    );
  }

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <StarryBackground>
        <View style={styles.container}>
          {/* Header avec logo et progression */}
          <View style={styles.header}>
            <Text style={styles.logo}>{t('common.appName')}</Text>
            <ProgressIndicator
              progress={progress}
              currentStep={currentQuestionIndex + 1}
              totalSteps={QUESTIONS_STRUCTURE.length}
            />
          </View>

          {/* Question Card - AVEC OPTIONS FILTRÉES */}
          <View style={[
            styles.questionContainer,
            isPricingScreen && styles.pricingQuestionContainer
          ]}>
            <QuestionCard
              question={currentQuestion}
              answer={answers[currentQuestion.id]}
              onAnswer={(answer) => saveAnswer(currentQuestion.id, answer)}
              triggerHaptic={triggerHapticFeedback}
              firstName={firstName}
              allAnswers={answers}
              onInfoScreenContinue={handleInfoScreenContinue}
            />
          </View>

          {/* CTA spécial pour pricing_screen ou boutons de navigation normaux */}
          {isPricingScreen ? (
            <PricingCTAButton
              onAccept={handlePricingOfferAccept}
              triggerHaptic={triggerHapticFeedback}
              firstName={firstName}
            />
          ) : (
            <NavigationButtons
              canGoBack={currentQuestionIndex > 0}
              canGoNext={!!answers[currentQuestion.id] || isInfoScreen || isPricingScreen}
              isLastQuestion={isLastQuestion}
              isInfoScreen={isInfoScreen}
              isPricingScreen={isPricingScreen}
              onPrevious={goToPreviousQuestion}
              onNext={goToNextQuestion}
              triggerHaptic={triggerHapticFeedback}
              currentQuestion={currentQuestion}
              allAnswers={answers}
              onReturnToWelcome={onReturnToWelcome}
            />
          )}

          {/* Debug info */}
          {__DEV__ && (
            <Text style={styles.debugText}>
              {t('debug.questionNumber', {
                current: currentQuestionIndex + 1,
                total: QUESTIONS_STRUCTURE.length,
                type: currentQuestion.type
              })}
            </Text>
          )}
        </View>

        {/* Modale Paywall */}
        <PaywallModal
          isVisible={isPaywallVisible}
          onClose={handlePaywallClose}
          onSubscribe={handlePaywallSubscribe}
          firstName={firstName}
          triggerHaptic={triggerHapticFeedback}
        />
      </StarryBackground>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    paddingTop: height * 0.06,
    alignItems: 'center',
    marginBottom: 20,
  },
  logo: {
    fontFamily: 'Poppins-Bold',
    fontSize: 24,
    color: '#FFFFFF',
    letterSpacing: 1.5,
    marginBottom: 15,
    textShadowColor: 'rgba(255, 255, 255, 0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  questionContainer: {
    flex: 1,
    marginBottom: 120,
  },
  pricingQuestionContainer: {
    flex: 1,
    marginBottom: 80,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  errorText: {
    color: '#FF0000',
    fontSize: 18,
    textAlign: 'center',
  },
  debugText: {
    color: '#FFFFFF',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 10,
    opacity: 0.7,
  },
});
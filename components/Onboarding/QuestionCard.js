import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import MultipleChoiceQuestion from './MultipleChoiceQuestion';
import TextInputQuestion from './TextInputQuestion';
import NameInputQuestion from './NameInputQuestion';
import MITInputQuestion from './MITInputQuestion';
import METInputQuestion from './METInputQuestion';
import InfoScreen from './InfoScreen';
import SignatureQuestion from './SignatureQuestion';
import PricingScreen from './PricingScreen';

export default function QuestionCard({
  question,
  answer,
  onAnswer,
  triggerHaptic,
  firstName,
  allAnswers = {}, // Toutes les réponses pour accéder aux objectifs sélectionnés
  onInfoScreenContinue // ✅ NOUVEAU: Fonction spécifique pour les info_screen
}) {
  // Fonction pour personnaliser le texte avec le prénom
  const personalizeText = (text) => {
    if (firstName && text) {
      return text.replace(/\[prénom\]/g, firstName);
    }
    return text;
  };

  // Fonction pour obtenir les objectifs sélectionnés (pour MITInputQuestion)
  const getSelectedObjectives = () => {
    // Récupérer les objectifs depuis la question 3
    return allAnswers[3] || [];
  };

  const renderQuestionContent = () => {
    switch (question.type) {
      case 'multiple_choice':
        return (
          <MultipleChoiceQuestion
            question={question}
            selectedAnswer={answer}
            onSelect={onAnswer}
            triggerHaptic={triggerHaptic}
          />
        );

      case 'name_input':
        return (
          <NameInputQuestion
            question={question}
            value={answer}
            onChangeText={onAnswer}
            triggerHaptic={triggerHaptic}
          />
        );

      case 'mit_input':
        return (
          <MITInputQuestion
            question={question}
            value={answer}
            onChangeText={onAnswer}
            triggerHaptic={triggerHaptic}
            firstName={firstName}
            selectedObjectives={getSelectedObjectives()}
          />
        );

      case 'met_input':
        return (
          <METInputQuestion
            question={question}
            value={answer}
            onChangeText={onAnswer}
            triggerHaptic={triggerHaptic}
            firstName={firstName}
            selectedObjectives={getSelectedObjectives()}
          />
        );

      case 'text_input':
        return (
          <TextInputQuestion
            question={question}
            value={answer}
            onChangeText={onAnswer}
            triggerHaptic={triggerHaptic}
            firstName={firstName}
          />
        );

      case 'info_screen':
        return (
          <InfoScreen
            question={question}
            onContinue={() => {
              // ✅ SIMPLIFIÉ: Juste déclencher la navigation directement
              if (onInfoScreenContinue) {
                onInfoScreenContinue();
              }
            }}
            triggerHaptic={triggerHaptic}
            firstName={firstName}
          />
        );

      case 'signature':
        return (
          <SignatureQuestion
            question={question}
            value={answer}
            onChangeText={onAnswer}
            triggerHaptic={triggerHaptic}
            firstName={firstName}
          />
        );

      case 'pricing_screen':
        return (
          <PricingScreen
            question={question}
            onSelect={onAnswer}
            triggerHaptic={triggerHaptic}
            firstName={firstName}
          />
        );

      default:
        return (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>
              Type de question non supporté: {question.type}
            </Text>
          </View>
        );
    }
  };

  // ✅ NOUVEAU: Si c'est pricing_screen, on retourne directement le composant
  // sans le wrapper standard pour une UX totalement libre
  if (question.type === 'pricing_screen') {
    return renderQuestionContent();
  }

  // ✅ Layout standard pour tous les autres types de questions
  return (
    <View style={styles.container}>
      {/* Titre de la question */}
      <View style={styles.questionHeader}>
        <Text style={styles.questionTitle}>
          {personalizeText(question.question)}
        </Text>
        {/* Afficher le subtitle SEULEMENT si ce n'est PAS un info_screen */}
        {question.subtitle && question.type !== 'info_screen' && (
          <Text style={styles.questionSubtitle}>
            {personalizeText(question.subtitle)}
          </Text>
        )}
      </View>

      {/* Contenu de la question */}
      <View style={styles.questionContent}>
        {renderQuestionContent()}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  questionHeader: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    alignItems: 'center',
  },
  questionTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 24,
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 32,
    marginBottom: 8,
    textShadowColor: 'rgba(255, 255, 255, 0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  questionSubtitle: {
    fontFamily: 'Poppins-Medium',
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 24,
  },
  questionContent: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 16,
    color: '#FF6B6B',
    textAlign: 'center',
  },
});
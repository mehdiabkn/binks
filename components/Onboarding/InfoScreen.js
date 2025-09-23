import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
} from 'react-native';

export default function InfoScreen({
  question,
  onContinue,
  triggerHaptic,
  firstName
}) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const buttonAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animation d'entrée
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
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
      // Animation du bouton après le contenu
      Animated.spring(buttonAnim, {
        toValue: 1,
        tension: 120,
        friction: 8,
        useNativeDriver: true,
      }).start();
    });
  }, []);

  const handleContinue = () => {
    triggerHaptic();
    onContinue();
  };

  // Personnaliser le texte avec le prénom si disponible
  const getPersonalizedText = (text) => {
    if (firstName && text) {
      return text.replace(/\[prénom\]/g, firstName);
    }
    return text;
  };

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
      {/* Contenu principal - SEULEMENT le subtitle */}
      <View style={styles.content}>
        {question.subtitle && (
          <Text style={styles.subtitle}>
            {getPersonalizedText(question.subtitle)}
          </Text>
        )}
      </View>

      {/* Bouton de continuation */}
      <Animated.View
        style={[
          styles.buttonContainer,
          {
            opacity: buttonAnim,
            transform: [{ scale: buttonAnim }],
          },
        ]}
      >
        <TouchableOpacity
          style={styles.continueButton}
          onPress={handleContinue}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>
            {question.buttonText || "Continuer"}
          </Text>
          <Text style={styles.buttonEmoji}>→</Text>
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 20,
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  subtitle: {
    fontFamily: 'Poppins-Medium',
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 28,
    paddingHorizontal: 10,
    fontStyle: 'italic',
  },
  buttonContainer: {
    alignItems: 'center',
    paddingBottom: 20,
  },
  continueButton: {
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderWidth: 2,
    borderColor: '#FFD700',
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
    color: '#FFD700',
    marginRight: 8,
  },
  buttonEmoji: {
    fontSize: 18,
    color: '#FFD700',
  },
});
import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { useTranslation } from 'react-i18next';

const { width } = Dimensions.get('window');

export default function ProgressIndicator({ progress, currentStep, totalSteps }) {
  const { t } = useTranslation();
  const progressAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  
  useEffect(() => {
    // Animation de la barre de progression
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 600,
      useNativeDriver: false,
    }).start();

    // Animation de pulsation pour l'étape actuelle
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [progress]);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.container}>
      {/* Étapes avec points */}
      <View style={styles.stepsContainer}>
        {Array.from({ length: totalSteps }, (_, index) => {
          const stepNumber = index + 1;
          const isCompleted = stepNumber < currentStep;
          const isCurrent = stepNumber === currentStep;
          
          return (
            <View key={stepNumber} style={styles.stepWrapper}>
              <Animated.View
                style={[
                  styles.stepDot,
                  isCompleted && styles.completedStep,
                  isCurrent && styles.currentStep,
                  isCurrent && {
                    transform: [{ scale: pulseAnim }],
                  },
                ]}
              >
                {isCompleted ? (
                  <Text style={styles.checkmark}>✓</Text>
                ) : (
                  <Text style={[
                    styles.stepNumber,
                    isCurrent && styles.currentStepNumber,
                  ]}>
                    {stepNumber}
                  </Text>
                )}
              </Animated.View>
              
              {/* Ligne de connexion */}
              {index < totalSteps - 1 && (
                <View style={[
                  styles.stepLine,
                  isCompleted && styles.completedLine,
                ]} />
              )}
            </View>
          );
        })}
      </View>

      {/* Barre de progression principale */}
      <View style={styles.progressBarContainer}>
        <View style={styles.progressBarBackground}>
          <Animated.View
            style={[
              styles.progressBarFill,
              {
                width: progressWidth,
              },
            ]}
          />
          
          {/* Effet de brillance */}
          <Animated.View
            style={[
              styles.progressShine,
              {
                width: progressWidth,
              },
            ]}
          />
        </View>
      </View>

      {/* Texte de progression - ✅ INTERNATIONALISÉ */}
      <View style={styles.progressTextContainer}>
        <Text style={styles.progressText}>
          {t('progress.step', { current: currentStep, total: totalSteps })}
        </Text>
        <Text style={styles.progressPercentage}>
          {t('progress.completed', { percentage: Math.round(progress * 100) })}
        </Text>
      </View>
    </View>
  );
}



const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
  },
  stepsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  stepWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  stepDot: {
    width: 12,
    height: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  completedStep: {
    backgroundColor: '#4ECDC4',
    borderColor: '#4ECDC4',
  },
  currentStep: {
    backgroundColor: '#FFD700',
    borderColor: '#FFD700',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 8,
    
  },
  stepNumber: {
    fontFamily: 'Poppins-Bold',
    fontSize: 1,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  currentStepNumber: {
    color: '#1A1A1A',
  },
  checkmark: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginHorizontal: 8,
  },
  completedLine: {
    backgroundColor: '#4ECDC4',
  },
  progressBarContainer: {
    width: width * 0.8,
    marginBottom: 12,
  },
  progressBarBackground: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 3,
    overflow: 'hidden',
    position: 'relative',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#FFD700',
    borderRadius: 3,
    position: 'relative',
  },
  progressShine: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 3,
  },
  progressTextContainer: {
    alignItems: 'center',
  },
  progressText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 14,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  progressPercentage: {
    fontFamily: 'Poppins-Medium',
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
  },
});
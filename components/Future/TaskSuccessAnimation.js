import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import HapticFeedback from 'react-native-haptic-feedback';

const { width, height } = Dimensions.get('window');

// Composant simple pour les confettis
const SimpleConfetti = ({ delay = 0, color }) => {
  const translateY = useRef(new Animated.Value(-20)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const rotation = useRef(new Animated.Value(0)).current;

  const startX = Math.random() * width;
  const endX = startX + (Math.random() - 0.5) * 100;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      // Apparition
      Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      // Chute simple
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: height * 0.6,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(translateX, {
          toValue: endX - startX,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(rotation, {
          toValue: 360,
          duration: 1500,
          useNativeDriver: true,
        }),
        // Disparition
        Animated.sequence([
          Animated.delay(800),
          Animated.timing(opacity, {
            toValue: 0,
            duration: 700,
            useNativeDriver: true,
          }),
        ]),
      ]),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.confetti,
        {
          left: startX,
          backgroundColor: color,
          opacity,
          transform: [
            { translateY },
            { translateX },
            { rotate: rotation.interpolate({
              inputRange: [0, 360],
              outputRange: ['0deg', '360deg'],
            }) },
          ],
        },
      ]}
    />
  );
};

export default function TaskSuccessAnimation({ 
  visible, 
  onComplete, 
  taskText,
  type = 'MIT',
  isSuccess = true // true pour MIT completed ou MET avoided, false pour MET failed
}) {
  const { t } = useTranslation();
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const triggerHaptic = () => {
    const options = {
      enableVibrateFallback: true,
      ignoreAndroidSystemSettings: false,
      ignoreIOSSystemSettings: false
    };
    
    // Success ou Error selon le contexte
    const hapticType = isSuccess ? 'notificationSuccess' : 'notificationError';
    HapticFeedback.trigger(hapticType, options);
  };

  useEffect(() => {
    if (visible) {
      triggerHaptic();
      
      // Animation d'entrée simple
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 6,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto-fermeture
      const timeout = setTimeout(() => {
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 0.8,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start(() => {
          // Reset
          scaleAnim.setValue(0);
          fadeAnim.setValue(0);
          onComplete && onComplete();
        });
      }, 2000);

      return () => clearTimeout(timeout);
    }
  }, [visible]);

  if (!visible) return null;

  const getConfig = () => {
    if (type === 'MIT') {
      if (isSuccess) {
        // MIT terminé avec succès
        return {
          emoji: '🎯',
          message: t('animations.success.mit.message'),
          submessage: t('animations.success.mit.submessage'),
          color: '#4CD964',
          confettiColors: ['#4CD964', '#32D74B', '#FFD700', '#FF9500']
        };
      } else {
        // MIT non terminé (cas rare mais possible)
        return {
          emoji: '😞',
          message: t('animations.failure.mit.message'),
          submessage: t('animations.failure.mit.submessage'),
          color: '#FF9500',
          confettiColors: []
        };
      }
    } else {
      // Type MET
      if (isSuccess) {
        // MET évité avec succès
        return {
          emoji: '🛡️',
          message: t('animations.success.met.message'),
          submessage: t('animations.success.met.submessage'),
          color: '#4CD964',
          confettiColors: ['#4CD964', '#32D74B', '#FFD700', '#FF9500']
        };
      } else {
        // MET pas évité (échec)
        return {
          emoji: '😔',
          message: t('animations.failure.met.message'),
          submessage: t('animations.failure.met.submessage'),
          color: '#FF6B6B',
          confettiColors: [] // Pas de confettis pour un échec
        };
      }
    }
  };

  const config = getConfig();

  return (
    <View style={styles.container} pointerEvents="none">
      {/* Fond semi-transparent */}
      <Animated.View
        style={[
          styles.backdrop,
          { opacity: fadeAnim }
        ]}
      />
      
      {/* Confettis seulement pour les succès */}
      {isSuccess && config.confettiColors.length > 0 && Array.from({ length: 12 }, (_, index) => (
        <SimpleConfetti
          key={index}
          delay={index * 100}
          color={config.confettiColors[index % config.confettiColors.length]}
        />
      ))}
      
      {/* Modal simple */}
      <View style={styles.modalContainer}>
        <Animated.View
          style={[
            styles.modal,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* Icône */}
          <View style={[styles.iconContainer, { backgroundColor: config.color }]}>
            <Text style={styles.emoji}>{config.emoji}</Text>
          </View>
          
          {/* Textes */}
          <Text style={styles.message}>{config.message}</Text>
          <Text style={styles.submessage}>{config.submessage}</Text>
          
          {/* Texte de la tâche */}
          {taskText && (
            <Text style={styles.taskText} numberOfLines={1}>
              "{taskText.length > 30 ? taskText.substring(0, 30) + '...' : taskText}"
            </Text>
          )}
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  confetti: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  modal: {
    backgroundColor: 'rgba(15, 15, 35, 0.95)',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
    minWidth: 280,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  emoji: {
    fontSize: 28,
  },
  message: {
    fontFamily: 'Poppins-Bold',
    fontSize: 20,
    color: '#FFFFFF',
    marginBottom: 4,
    textAlign: 'center',
  },
  submessage: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 12,
    textAlign: 'center',
  },
  taskText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    fontStyle: 'italic',
    paddingHorizontal: 8,
  },
});
import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { 
  Trophy,
  Star,
  CheckCircle2,
  Calendar,
  ArrowRight,
  BookOpen,
  Sparkles
} from 'lucide-react-native';
import HapticFeedback from 'react-native-haptic-feedback';

const { width, height } = Dimensions.get('window');

// Composant pour les particules animées
const AnimatedParticle = ({ delay = 0, duration = 2000 }) => {
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const animate = () => {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: -200,
          duration: duration,
          delay: delay,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: duration,
          delay: delay,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(scale, {
            toValue: 1.2,
            duration: duration * 0.3,
            delay: delay,
            useNativeDriver: true,
          }),
          Animated.timing(scale, {
            toValue: 0,
            duration: duration * 0.7,
            useNativeDriver: true,
          }),
        ]),
      ]).start(() => {
        // Reset et recommencer l'animation
        translateY.setValue(0);
        opacity.setValue(1);
        scale.setValue(1);
        setTimeout(animate, Math.random() * 1000);
      });
    };

    animate();
  }, []);

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          transform: [{ translateY }, { scale }],
          opacity,
          left: Math.random() * width,
        },
      ]}
    >
      <Star size={12} color="#FFD700" fill="#FFD700" />
    </Animated.View>
  );
};

export default function CelebrationModal({ 
  visible, 
  objective, 
  onClose, 
  onNavigateToJournal, 
  userProfile 
}) {
  const { t } = useTranslation();
  
  // Animations
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Fonction de feedback haptique
  const triggerSuccessHaptic = () => {
    const options = {
      enableVibrateFallback: true,
      ignoreAndroidSystemSettings: false,
      ignoreIOSSystemSettings: false
    };
    HapticFeedback.trigger('notificationSuccess', options);
  };

  const triggerSelectionHaptic = () => {
    const options = {
      enableVibrateFallback: true,
      ignoreAndroidSystemSettings: false,
      ignoreIOSSystemSettings: false
    };
    HapticFeedback.trigger('selection', options);
  };

  // Animation d'entrée
  useEffect(() => {
    if (visible && objective) {
      triggerSuccessHaptic();
      
      // Animation d'entrée
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]).start();

      // Animation de pulsation continue pour le trophée
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      pulseAnimation.start();

      return () => {
        pulseAnimation.stop();
      };
    } else {
      // Reset des animations
      scaleAnim.setValue(0);
      slideAnim.setValue(50);
      fadeAnim.setValue(0);
      pulseAnim.setValue(1);
    }
  }, [visible, objective]);

  // Messages de félicitations selon la catégorie
  const getCelebrationMessage = (objective) => {
    const category = objective?.category;
    const firstName = userProfile?.firstName || 'Champion';
    
    switch (category) {
      case 'health':
        return {
          title: t('objectives.celebration.messages.health.title', { firstName }) || `Bravo ${firstName} !`,
          subtitle: t('objectives.celebration.messages.health.subtitle') || 'Tu as pris soin de ta santé !',
          emoji: '💪',
        };
      case 'learning':
        return {
          title: t('objectives.celebration.messages.learning.title', { firstName }) || `Félicitations ${firstName} !`,
          subtitle: t('objectives.celebration.messages.learning.subtitle') || 'Ton savoir s\'enrichit !',
          emoji: '🧠',
        };
      case 'professional':
        return {
          title: t('objectives.celebration.messages.professional.title', { firstName }) || `Excellent ${firstName} !`,
          subtitle: t('objectives.celebration.messages.professional.subtitle') || 'Ta carrière progresse !',
          emoji: '',
        };
      case 'personal':
        return {
          title: t('objectives.celebration.messages.personal.title', { firstName }) || `Magnifique ${firstName} !`,
          subtitle: t('objectives.celebration.messages.personal.subtitle') || 'Tu deviens la meilleure version de toi-même !',
          emoji: '✨',
        };
      default:
        return {
          title: t('objectives.celebration.messages.default.title', { firstName }) || `Incroyable ${firstName} !`,
          subtitle: t('objectives.celebration.messages.default.subtitle') || 'Tu as accompli quelque chose de formidable !',
          emoji: '🎉',
        };
    }
  };

  // Calculer la durée de l'objectif
  const getObjectiveDuration = (objective) => {
    if (!objective?.createdAt || !objective?.completedAt) return null;
    
    const startDate = new Date(objective.createdAt);
    const endDate = new Date(objective.completedAt);
    const diffTime = Math.abs(endDate - startDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  };

  // Gestion des actions
  const handleClose = () => {
    triggerSelectionHaptic();
    onClose();
  };

  const handleNavigateToJournal = () => {
    triggerSelectionHaptic();
    onNavigateToJournal();
  };

  if (!objective) return null;

  const celebrationMessage = getCelebrationMessage(objective);
  const duration = getObjectiveDuration(objective);

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        {/* Particules animées */}
        {Array.from({ length: 15 }).map((_, index) => (
          <AnimatedParticle 
            key={index} 
            delay={index * 200} 
            duration={2000 + Math.random() * 1000}
          />
        ))}

        <Animated.View
          style={[
            styles.container,
            {
              opacity: fadeAnim,
              transform: [
                { scale: scaleAnim },
                { translateY: slideAnim },
              ],
            },
          ]}
        >
          {/* Icône principale */}
          <Animated.View
            style={[
              styles.iconContainer,
              { transform: [{ scale: pulseAnim }] },
            ]}
          >
            <Trophy size={48} color="#FFD700" strokeWidth={2.5} />
            <View style={styles.sparklesContainer}>
              <Sparkles size={20} color="#FFD700" fill="#FFD700" />
            </View>
          </Animated.View>

          {/* Emoji de catégorie */}
          <Text style={styles.categoryEmoji}>{celebrationMessage.emoji}</Text>

          {/* Titre principal */}
          <Text style={styles.mainTitle}>{celebrationMessage.title}</Text>
          <Text style={styles.subtitle}>{celebrationMessage.subtitle}</Text>

          {/* Détails de l'objectif */}
          <View style={styles.objectiveDetails}>
            <View style={styles.objectiveHeader}>
              <CheckCircle2 size={20} color="#4CD964" strokeWidth={2} />
              <Text style={styles.objectiveTitle}>{objective.title}</Text>
            </View>
            
            <View style={styles.objectiveStats}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {objective.targetValue} {objective.unit}
                </Text>
                <Text style={styles.statLabel}>
                  {t('objectives.celebration.stats.achieved')}
                </Text>
              </View>
              
              {duration && (
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{duration}</Text>
                  <Text style={styles.statLabel}>
                    {duration === 1 
                      ? t('objectives.celebration.stats.day')
                      : t('objectives.celebration.stats.days')
                    }
                  </Text>
                </View>
              )}
              
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {t(`objectives.categories.${objective?.category}`) || objective?.category || 'Personnel'}
                </Text>
                <Text style={styles.statLabel}>
                  {t('objectives.celebration.stats.category')}
                </Text>
              </View>
            </View>
          </View>

          {/* Message motivationnel */}
          <View style={styles.motivationContainer}>
            <Text style={styles.motivationText}>
              {t('objectives.celebration.motivation')}
            </Text>
          </View>

          {/* Boutons d'action */}
          <View style={styles.actionsContainer}>

            
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={handleClose}
              activeOpacity={0.8}
            >
              <Text style={styles.journalButtonText}>
                {t('objectives.celebration.buttons.close')}
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 15, 35, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  container: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  
  // Particules
  particle: {
    position: 'absolute',
    top: height * 0.8,
  },
  
  // Icône principale
  iconContainer: {
    position: 'relative',
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sparklesContainer: {
    position: 'absolute',
    top: -10,
    right: -10,
  },
  
  // Emoji de catégorie
  categoryEmoji: {
    fontSize: 32,
    marginBottom: 16,
  },
  
  // Textes principaux
  mainTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 24,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: 'Poppins-Medium',
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  
  // Détails de l'objectif
  objectiveDetails: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  objectiveHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  objectiveTitle: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
    flex: 1,
  },
  objectiveStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontFamily: 'Poppins-Bold',
    fontSize: 18,
    color: '#FFD700',
    marginBottom: 4,
  },
  statLabel: {
    fontFamily: 'Poppins-Regular',
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
  },
  
  // Message motivationnel
  motivationContainer: {
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.2)',
  },
  motivationText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 20,
  },
  
  // Boutons d'action
  actionsContainer: {
    width: '100%',
    gap: 12,
  },
  journalButton: {
    backgroundColor: '#4CD964',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#4CD964',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  journalButtonText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  closeButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  closeButtonText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.8)',
  },
});
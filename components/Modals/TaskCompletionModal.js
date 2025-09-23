import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  Dimensions,
} from 'react-native';
import HapticFeedback from 'react-native-haptic-feedback';

const { width, height } = Dimensions.get('window');

export default function TaskCompletionModal({ 
  isVisible, 
  task, 
  onConfirm, 
  onCancel 
}) {
  
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isVisible) {
      // Animation d'ouverture
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      // Animation de pulsation pour attirer l'attention
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
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

      return () => pulseAnimation.stop();
    } else {
      // Animation de fermeture
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 0.5,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isVisible]);

  const triggerHapticFeedback = (type = 'selection') => {
    const options = {
      enableVibrateFallback: true,
      ignoreAndroidSystemSettings: false,
      ignoreIOSSystemSettings: false
    };
    HapticFeedback.trigger(type, options);
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'work': return '#FFD700';
      case 'health': return '#4CD964';
      case 'personal': return '#FF6B6B';
      default: return '#999999';
    }
  };

  const getCategoryEmoji = (category) => {
    switch (category) {
      case 'work': return '💼';
      case 'health': return '💪';
      case 'personal': return '🏠';
      default: return '📋';
    }
  };

  const handleConfirm = () => {
    triggerHapticFeedback('impactHeavy');
    onConfirm && onConfirm();
  };

  const handleCancel = () => {
    triggerHapticFeedback('selection');
    onCancel && onCancel();
  };

  if (!task) return null;

  return (
    <Modal
      transparent
      visible={isVisible}
      onRequestClose={handleCancel}
      animationType="none"
    >
      <Animated.View 
        style={[
          styles.overlay,
          { opacity: opacityAnim }
        ]}
      >
        <TouchableOpacity 
          style={styles.backdrop}
          onPress={handleCancel}
          activeOpacity={1}
        />
        
        <Animated.View
          style={[
            styles.modal,
            {
              transform: [
                { scale: scaleAnim },
                { scale: pulseAnim },
              ],
            },
          ]}
        >
          {/* Header avec icône de la catégorie */}
          <View style={styles.header}>
            <View style={[
              styles.categoryIcon,
              { backgroundColor: getCategoryColor(task.category) }
            ]}>
              <Text style={styles.categoryIconText}>
                {getCategoryEmoji(task.category)}
              </Text>
            </View>
          </View>

          {/* Message principal */}
          <View style={styles.content}>
            <Text style={styles.title}>Terminer cette tâche ?</Text>
            
            <Text style={styles.taskName} numberOfLines={2}>
              "{task.title}"
            </Text>
            
            <Text style={styles.description}>
              Cette action va déplacer la tâche vers "C'est de l'histoire ancienne"
            </Text>

            {/* Indicateur de progression actuelle */}
            <View style={styles.progressInfo}>
              <Text style={styles.progressLabel}>Progression actuelle :</Text>
              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <View 
                    style={[
                      styles.progressFill,
                      { 
                        width: `${task.progress}%`,
                        backgroundColor: getCategoryColor(task.category) 
                      }
                    ]}
                  />
                </View>
                <Text style={styles.progressText}>{task.progress}%</Text>
              </View>
            </View>
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleCancel}
            >
              <Text style={styles.cancelButtonText}>Annuler</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.confirmButton,
                { backgroundColor: getCategoryColor(task.category) }
              ]}
              onPress={handleConfirm}
            >
              <Text style={styles.confirmButtonText}>✓ Terminer</Text>
            </TouchableOpacity>
          </View>

          {/* Petit indicateur en bas */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              💡 Tu peux toujours la reprendre plus tard
            </Text>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modal: {
    backgroundColor: 'rgba(20, 20, 30, 0.98)',
    borderRadius: 24,
    marginHorizontal: 30,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    
    // Ombre dramatique
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },

  // Header
  header: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 10,
  },
  categoryIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    
    // Effet de glow
    shadowColor: 'currentColor',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 5,
  },
  categoryIconText: {
    fontSize: 28,
  },

  // Contenu principal
  content: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    alignItems: 'center',
  },
  title: {
    fontFamily: 'Poppins-Bold',
    fontSize: 22,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 16,
  },
  taskName: {
    fontFamily: 'Poppins-Medium',
    fontSize: 16,
    color: '#FFD700',
    textAlign: 'center',
    marginBottom: 12,
    fontStyle: 'italic',
  },
  description: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },

  // Progression
  progressInfo: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  progressLabel: {
    fontFamily: 'Poppins-Bold',
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 8,
    textAlign: 'center',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 4,
    marginRight: 12,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 14,
    color: '#FFFFFF',
    minWidth: 40,
    textAlign: 'right',
  },

  // Actions
  actions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 20,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  cancelButtonText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    
    // Effet de glow pour le bouton principal
    shadowColor: 'currentColor',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  confirmButtonText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 14,
    color: '#000000',
  },

  // Footer
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    alignItems: 'center',
  },
  footerText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
  },
});
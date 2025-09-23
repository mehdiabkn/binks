import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import HapticFeedback from 'react-native-haptic-feedback';

export default function CompletedTaskItem({ 
  task, 
  animation,
  onRestore,
  onPress 
}) {
  
  const triggerHapticFeedback = (type = 'selection') => {
    const options = {
      enableVibrateFallback: true,
      ignoreAndroidSystemSettings: false,
      ignoreIOSSystemSettings: false
    };
    HapticFeedback.trigger(type, options);
  };

  const getCategoryEmoji = (category) => {
    switch (category) {
      case 'work': return '💼';
      case 'health': return '💪';
      case 'personal': return '🏠';
      default: return '📋';
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'work': return '#FFD700';
      case 'health': return '#4CD964';
      case 'personal': return '#FF6B6B';
      default: return '#999999';
    }
  };

  const handleRestore = () => {
    triggerHapticFeedback('impactMedium');
    onRestore && onRestore(task.id);
  };

  const handlePress = () => {
    triggerHapticFeedback('impactLight');
    onPress && onPress(task);
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: animation.opacity,
          transform: [
            { scale: animation.scale },
            { translateX: animation.translateX },
          ],
        },
      ]}
    >
      <TouchableOpacity
        style={[
          styles.content,
          { borderLeftColor: getCategoryColor(task.category) }
        ]}
        onPress={handlePress}
        activeOpacity={0.8}
      >
        {/* Icône de validation avec animation */}
        <View style={styles.iconContainer}>
          <View style={styles.checkmarkCircle}>
            <Text style={styles.checkmark}>✓</Text>
          </View>
          <View style={styles.completionRing} />
        </View>

        {/* Contenu principal */}
        <View style={styles.mainContent}>
          {/* Titre avec effet barré stylé */}
          <Text style={styles.title} numberOfLines={1}>
            {task.title}
          </Text>
          
          {/* Ligne de métadonnées */}
          <View style={styles.metadata}>
            {/* Catégorie avec style */}
            <View style={[
              styles.categoryBadge,
              { 
                backgroundColor: `${getCategoryColor(task.category)}20`,
                borderColor: getCategoryColor(task.category) 
              }
            ]}>
              <Text style={styles.categoryEmoji}>
                {getCategoryEmoji(task.category)}
              </Text>
              <Text style={[
                styles.categoryText,
                { color: getCategoryColor(task.category) }
              ]}>
                {task.category}
              </Text>
            </View>

            {/* Temps écoulé depuis completion */}
            {task.completedAt && (
              <View style={styles.timeContainer}>
                <Text style={styles.timeIcon}>🕐</Text>
                <Text style={styles.timeText}>
                  {new Date(task.completedAt).toLocaleTimeString('fr-FR', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Bouton restaurer avec style */}
        <TouchableOpacity
          style={styles.restoreButton}
          onPress={(e) => {
            e.stopPropagation();
            handleRestore();
          }}
        >
          <Text style={styles.restoreIcon}>↶</Text>
          <Text style={styles.restoreText}>Reprendre</Text>
        </TouchableOpacity>
      </TouchableOpacity>

      {/* Barre de progression subtile en arrière-plan */}
      <View style={styles.progressBackground}>
        <View 
          style={[
            styles.progressFill,
            { backgroundColor: getCategoryColor(task.category) }
          ]}
        />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
    position: 'relative',
    overflow: 'hidden',
  },
  
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76, 217, 100, 0.08)',
    borderRadius: 16,
    padding: 18,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: 'rgba(76, 217, 100, 0.15)',
    
    // Ombre subtile
    shadowColor: '#4CD964',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },

  // Icône de validation stylée
  iconContainer: {
    position: 'relative',
    marginRight: 16,
  },
  checkmarkCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#4CD964',
    alignItems: 'center',
    justifyContent: 'center',
    
    // Effet de glow
    shadowColor: '#4CD964',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  completionRing: {
    position: 'absolute',
    top: -2,
    left: -2,
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'rgba(76, 217, 100, 0.3)',
  },
  checkmark: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },

  // Contenu principal
  mainContent: {
    flex: 1,
    paddingRight: 12,
  },
  title: {
    fontFamily: 'Poppins-Bold',
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 8,
    textDecorationLine: 'line-through',
    textDecorationColor: 'rgba(255, 255, 255, 0.4)',
    textDecorationStyle: 'solid',
    opacity: 0.85,
  },
  
  metadata: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  // Badge catégorie stylé
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  categoryEmoji: {
    fontSize: 14,
    marginRight: 6,
  },
  categoryText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },

  // Temps de completion
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  timeIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  timeText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.7)',
  },

  // Bouton restaurer stylé
  restoreButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    minWidth: 70,
    
    // Effet de hover subtil
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  restoreIcon: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 2,
  },
  restoreText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 9,
    color: 'rgba(255, 255, 255, 0.8)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Barre de progression en arrière-plan
  progressBackground: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: 'rgba(76, 217, 100, 0.2)',
  },
  progressFill: {
    height: '100%',
    width: '100%',
    opacity: 0.6,
  },
});
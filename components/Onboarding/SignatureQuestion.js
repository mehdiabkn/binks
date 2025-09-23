import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  PanResponder,
  Animated,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useTranslation } from 'react-i18next';

const { width, height } = Dimensions.get('window');

export default function SignatureQuestion({ 
  question, 
  value,           
  onChangeText,    
  triggerHaptic,
  firstName 
}) {
  const { t } = useTranslation();
  const [paths, setPaths] = useState(value?.paths || []); // ✅ Utilisez 'value' au lieu de 'signature'
  const [currentPath, setCurrentPath] = useState('');
  const [isDrawing, setIsDrawing] = useState(false);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const signaturePadRef = useRef(null);

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
    ]).start();
  }, []);

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,

    onPanResponderGrant: (evt) => {
      const { locationX, locationY } = evt.nativeEvent;
      setIsDrawing(true);
      setCurrentPath(`M${locationX.toFixed(2)},${locationY.toFixed(2)}`);
      triggerHaptic();
    },

    onPanResponderMove: (evt) => {
      const { locationX, locationY } = evt.nativeEvent;
      setCurrentPath(prev => `${prev} L${locationX.toFixed(2)},${locationY.toFixed(2)}`);
    },

    onPanResponderRelease: () => {
      setIsDrawing(false);
      if (currentPath.length > 0) {
        const newPaths = [...paths, currentPath];
        setPaths(newPaths);
        setCurrentPath('');
        
        // Sauvegarder la signature
        onChangeText({
          paths: newPaths,
          timestamp: new Date().toISOString(),
        });
        
        triggerHaptic();
      }
    },
  });

  const clearSignature = () => {
    setPaths([]);
    setCurrentPath('');
    onChangeText(null);
    triggerHaptic();
  };

  const hasSignature = paths.length > 0 || currentPath.length > 0;

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
      {/* Instructions fixes en haut */}
      <View style={styles.instructionsContainer}>
        <Text style={styles.instructionText}>
          {isDrawing ? t('signature.instructions.drawing') : 
           hasSignature ? t('signature.instructions.saved') : 
           t('signature.instructions.default')}
        </Text>
      </View>

      {/* Zone de signature - position fixe */}
      <View style={styles.signatureContainer}>
        <View 
          style={styles.signaturePad}
          ref={signaturePadRef}
          {...panResponder.panHandlers}
        >
          <Svg
            style={styles.svg}
            width="100%"
            height="100%"
          >
            {/* Paths de la signature sauvegardée */}
            {paths.map((path, index) => (
              <Path
                key={index}
                d={path}
                stroke="#FFD700"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            ))}
            
            {/* Path en cours de dessin */}
            {currentPath && (
              <Path
                d={currentPath}
                stroke="#FFD700"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
                opacity="0.8"
              />
            )}
          </Svg>

          {/* Placeholder quand pas de signature */}
          {!hasSignature && (
            <View style={styles.placeholderContainer}>
              <Text style={styles.placeholderText}>✍️</Text>
              <Text style={styles.placeholderSubtext}>
                {question.placeholder}
              </Text>
            </View>
          )}

          {/* Ligne de signature décorative */}
          <View style={styles.signatureLine} />
        </View>
      </View>

      {/* Zone fixe pour le bouton et message - même hauteur toujours */}
      <View style={styles.bottomContainer}>
        {/* Bouton pour effacer - position fixe */}
        <View style={styles.clearButtonContainer}>
          {hasSignature ? (
            <TouchableOpacity 
              style={styles.clearButton}
              onPress={clearSignature}
              activeOpacity={0.8}
            >
              <Text style={styles.clearButtonText}>{t('signature.clearButton')}</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.invisibleButton} />
          )}
        </View>

        {/* Message d'engagement - position fixe */}
        <View style={styles.commitmentContainer}>
          {hasSignature && (
            <Animated.View 
              style={[
                styles.commitmentMessage,
                {
                  opacity: fadeAnim,
                },
              ]}
            >
              <Text style={[styles.commitmentText, styles.strikethroughText]}>
                {t('signature.commitment.title')}
              </Text>
              <Text style={styles.commitmentSubtext}>
                {t('signature.commitment.message')}
              </Text>
            </Animated.View>
          )}
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 15,
    justifyContent: 'center',
  },
  instructionsContainer: {
    alignItems: 'center',
    marginBottom: 15,
    height: 20, // Réduit
  },
  instructionText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14, // Réduit
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  signatureContainer: {
    alignItems: 'center',
    marginBottom: 15,
    height: 160, // Hauteur réduite
  },
  signaturePad: {
    width: width * 0.8,
    height: 140, // Hauteur réduite
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 15,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  svg: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 2,
  },
  placeholderContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  placeholderText: {
    fontSize: 32, // Réduit
    marginBottom: 5,
  },
  placeholderSubtext: {
    fontFamily: 'Poppins-Medium',
    fontSize: 12, // Réduit
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    paddingHorizontal: 10,
  },
  signatureLine: {
    position: 'absolute',
    bottom: 25, // Ajusté
    left: 20,
    right: 20,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    zIndex: 1,
  },
  bottomContainer: {
    height: 90, // Hauteur fixe réduite
    justifyContent: 'flex-start',
  },
  clearButtonContainer: {
    alignItems: 'center',
    height: 35, // Réduit
    justifyContent: 'center',
    marginBottom: 10,
  },
  clearButton: {
    backgroundColor: 'rgba(255, 107, 107, 0.2)',
    borderRadius: 12,
    paddingVertical: 8, // Réduit
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.5)',
  },
  clearButtonText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 12, // Réduit
    color: '#FF6B6B',
  },
  invisibleButton: {
    height: 25, // Réduit
    width: 60,
  },
  commitmentContainer: {
    minHeight: 45, // Réduit
    justifyContent: 'center',
  },
  commitmentMessage: {
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderRadius: 12,
    padding: 12, // Réduit
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
    alignItems: 'center',
  },
  commitmentText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 14, // Réduit
    color: '#FFD700',
    marginBottom: 4,
    textAlign: 'center',
  },
  commitmentSubtext: {
    fontFamily: 'Poppins-Medium',
    fontSize: 11, // Réduit
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 14,
  },
  strikethroughText: {
    textDecorationLine: 'line-through',
    textDecorationStyle: 'solid',
    textDecorationColor: '#FFD700',
  },
});
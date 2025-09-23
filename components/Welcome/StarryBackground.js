import React, { useEffect, useRef } from 'react';
import {
  View,
  Animated,
  Dimensions,
  StyleSheet,
} from 'react-native';

const { width, height } = Dimensions.get('window');

// Génère les couches de gradient
const generateGradientLayers = () => {
  const layers = [];
  const totalLayers = 50; // 50 couches pour un gradient très fluide
  
  for (let i = 0; i < totalLayers; i++) {
    const progress = i / (totalLayers - 1);
    
    // Interpolation des couleurs de haut en bas
    let r, g, b;
    
    if (progress < 0.3) {
      // Haut: violet nuit vers bleu nuit
      const localProgress = progress / 0.3;
      r = Math.round(26 + (22 - 26) * localProgress); // 1A vers 16
      g = Math.round(11 + (33 - 11) * localProgress); // 0B vers 21
      b = Math.round(46 + (62 - 46) * localProgress); // 2E vers 3E
    } else if (progress < 0.6) {
      // Milieu: bleu nuit vers violet aurore
      const localProgress = (progress - 0.3) / 0.3;
      r = Math.round(22 + (83 - 22) * localProgress); // 16 vers 53
      g = Math.round(33 + (52 - 33) * localProgress); // 21 vers 34
      b = Math.round(62 + (131 - 62) * localProgress); // 3E vers 83
    } else {
      // Bas: violet vers orange/jaune
      const localProgress = (progress - 0.6) / 0.4;
      r = Math.round(83 + (255 - 83) * localProgress); // 53 vers FF
      g = Math.round(52 + (180 - 52) * localProgress); // 34 vers B4
      b = Math.round(131 + (77 - 131) * localProgress); // 83 vers 4D
    }
    
    layers.push({
      id: i,
      backgroundColor: `rgb(${r}, ${g}, ${b})`,
      top: `${progress * 100}%`,
      height: `${100 / totalLayers + 2}%`, // Léger chevauchement
      opacity: 0.6,
    });
  }
  
  return layers;
};
const generateStars = (count) => {
  return Array.from({ length: count }, (_, index) => ({
    id: index,
    x: Math.random() * width,
    y: Math.random() * height,
    size: Math.random() * 2 + 1,
    animationDelay: Math.random() * 3000,
  }));
};

const Star = ({ star }) => {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animate = () => {
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 1000 + Math.random() * 1000,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 1000 + Math.random() * 1000,
          useNativeDriver: true,
        }),
      ]).start(() => animate());
    };

    const timeout = setTimeout(animate, star.animationDelay);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <Animated.View
      style={[
        styles.star,
        {
          left: star.x,
          top: star.y,
          width: star.size,
          height: star.size,
          opacity,
        },
      ]}
    />
  );
};

export default function StarryBackground({ children }) {
  const stars = useRef(generateStars(100)).current;

  return (
    <View style={styles.container}>
      {/* Effet d'aurore subtil avec une seule couche douce */}
      <View style={styles.auroraGlow} />
      
      {/* Étoiles scintillantes */}
      {stars.map((star) => (
        <Star key={star.id} star={star} />
      ))}
      
      {/* Contenu par-dessus */}
      <View style={styles.contentContainer}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A2B4A', // Bleu nuit principal
  },
  auroraGlow: {
    position: 'absolute',
    bottom: -height * 0.4,
    left: -width * 0.3,
    width: width * 1.6,
    height: height * 0.8,
    backgroundColor: '#FF6B35', // Orange aurore
    borderRadius: width,
    opacity: 0.03, // Très subtil
    zIndex: 1,
  },
  contentContainer: {
    flex: 1,
    position: 'relative',
    zIndex: 10,
  },
  star: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    borderRadius: 50,
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
    elevation: 5,
    zIndex: 5,
  },
});
// screens/SplashScreen.js

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  StatusBar,
} from 'react-native';
import { useTranslation } from 'react-i18next';

const { width, height } = Dimensions.get('window');

export default function SplashScreen({ onFinish }) {
  const { t } = useTranslation();
  
  // Animations pour l'écriture du nom lettre par lettre
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleScale = useRef(new Animated.Value(0.8)).current;
  
  const subtitleOpacity = useRef(new Animated.Value(0)).current;
  const subtitleTranslateY = useRef(new Animated.Value(20)).current;
  
  const backgroundOpacity = useRef(new Animated.Value(1)).current;
  
  // Animation d'écriture du titre
  const letterAnimations = useRef([]);
  const appName = t('common.appName') || 'Habitus';

  // Initialiser les animations pour chaque lettre
  useEffect(() => {
    letterAnimations.current = appName.split('').map(() => ({
      opacity: new Animated.Value(0),
      scale: new Animated.Value(0.3),
      translateY: new Animated.Value(-10),
    }));
  }, [appName]);

  useEffect(() => {
    // Séquence d'animation complète
    const startAnimations = async () => {
      // 1. Animation d'apparition du conteneur du titre
      Animated.parallel([
        Animated.timing(titleOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.spring(titleScale, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();

      // 2. Animation des lettres une par une (effet machine à écrire)
      const letterDelays = letterAnimations.current.map((_, index) => 
        setTimeout(() => {
          Animated.parallel([
            Animated.timing(letterAnimations.current[index].opacity, {
              toValue: 1,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.spring(letterAnimations.current[index].scale, {
              toValue: 1,
              tension: 150,
              friction: 6,
              useNativeDriver: true,
            }),
            Animated.timing(letterAnimations.current[index].translateY, {
              toValue: 0,
              duration: 300,
              useNativeDriver: true,
            }),
          ]).start();
        }, index * 100 + 800) // Commence après 800ms, puis 100ms entre chaque lettre
      );

      // 3. Attendre que toutes les lettres soient apparues + délai
      setTimeout(() => {
        // Animation du sous-titre
        Animated.parallel([
          Animated.timing(subtitleOpacity, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(subtitleTranslateY, {
            toValue: 0,
            duration: 600,
            useNativeDriver: true,
          }),
        ]).start();
      }, 800 + appName.length * 100 + 500);

      // 4. Animation de sortie après un délai total
      setTimeout(() => {
        Animated.timing(backgroundOpacity, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }).start(() => {
          if (onFinish) {
            onFinish();
          }
        });
      }, 3500); // 3.5 secondes au total

      // Nettoyage des timeouts
      return () => {
        letterDelays.forEach(clearTimeout);
      };
    };

    startAnimations();
  }, [appName]);

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#0F0F23" />
      <Animated.View 
        style={[
          styles.container,
          { opacity: backgroundOpacity }
        ]}
      >
        {/* Background étoilé subtil */}
        <View style={styles.starsContainer}>
          {[...Array(15)].map((_, index) => (
            <View 
              key={index}
              style={[
                styles.star, 
                {
                  top: `${Math.random() * 100}%`,
                  left: `${Math.random() * 100}%`,
                  opacity: Math.random() * 0.6 + 0.2,
                }
              ]} 
            />
          ))}
        </View>
        
        {/* Contenu principal */}
        <View style={styles.content}>
          {/* Titre avec animation d'écriture */}
          <Animated.View 
            style={[
              styles.titleContainer,
              {
                opacity: titleOpacity,
                transform: [{ scale: titleScale }],
              }
            ]}
          >
            <View style={styles.titleLettersContainer}>
              {appName.split('').map((letter, index) => (
                <Animated.Text
                  key={index}
                  style={[
                    styles.titleLetter,
                    {
                      opacity: letterAnimations.current[index]?.opacity || 0,
                      transform: [
                        { 
                          scale: letterAnimations.current[index]?.scale || new Animated.Value(0.3)
                        },
                        { 
                          translateY: letterAnimations.current[index]?.translateY || new Animated.Value(-10)
                        },
                      ],
                    }
                  ]}
                >
                  {letter}
                </Animated.Text>
              ))}
            </View>
          </Animated.View>
          
          {/* Sous-titre */}
          <Animated.View 
            style={[
              styles.subtitleContainer,
              {
                opacity: subtitleOpacity,
                transform: [{ translateY: subtitleTranslateY }],
              }
            ]}
          >
            <Text style={styles.subtitle}>
              {t('common.subtitle') || 'Forge ton excellence quotidienne'}
            </Text>
          </Animated.View>
        </View>
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F23',
    justifyContent: 'center',
    alignItems: 'center',
  },
  starsContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  star: {
    position: 'absolute',
    width: 2,
    height: 2,
    backgroundColor: 'rgba(255, 215, 0, 0.6)',
    borderRadius: 1,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  titleContainer: {
    marginBottom: 24,
  },
  titleLettersContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleLetter: {
    fontSize: 48,
    fontFamily: 'Poppins-Bold',
    color: '#FFFFFF',
    letterSpacing: 2,
    textShadowColor: 'rgba(255, 215, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
    marginHorizontal: 1,
  },
  subtitleContainer: {
    alignItems: 'center',
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Poppins-Medium',
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    letterSpacing: 0.5,
    lineHeight: 24,
  },
});
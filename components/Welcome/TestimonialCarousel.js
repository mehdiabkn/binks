// components/Welcome/FloatingTestimonials.js
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableWithoutFeedback,
} from 'react-native';
import { useTranslation } from 'react-i18next';

const { width } = Dimensions.get('window');

export default function FloatingTestimonials() {
  const { t } = useTranslation();
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  
  // UNE SEULE animation simple
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const intervalRef = useRef(null);

  // Témoignages depuis les traductions
  const testimonials = [
    {
      name: t('testimonials.laetitia.name'),
      role: t('testimonials.laetitia.role'),
      quote: t('testimonials.laetitia.quote'),
    },
    {
      name: t('testimonials.lisa.name'),
      role: t('testimonials.lisa.role'),
      quote: t('testimonials.lisa.quote'),
    },
    {
      name: t('testimonials.sara.name'),
      role: t('testimonials.sara.role'),
      quote: t('testimonials.sara.quote'),
    },
    {
      name: t('testimonials.pierre.name'),
      role: t('testimonials.pierre.role'),
      quote: t('testimonials.pierre.quote'),
    },
    {
      name: t('testimonials.lowenn.name'),
      role: t('testimonials.lowenn.role'),
      quote: t('testimonials.lowenn.quote'),
    },
  ];

  // Fonction simple pour changer de témoignage
  const changeTestimonial = () => {
    // Animation de sortie rapide
    Animated.timing(fadeAnim, {
      toValue: 0.3,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      // Changer le contenu
      setCurrentIndex((prevIndex) => (prevIndex + 1) % testimonials.length);
      
      // Animation d'entrée
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    });
  };

  // Auto-slide simple
  const startAutoSlide = () => {
    if (intervalRef.current) return;
    
    intervalRef.current = setInterval(() => {
      if (!isPaused) {
        changeTestimonial();
      }
    }, 4000);
  };

  const stopAutoSlide = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  useEffect(() => {
    const initTimeout = setTimeout(() => {
      startAutoSlide();
    }, 2000);

    return () => {
      clearTimeout(initTimeout);
      stopAutoSlide();
    };
  }, []);

  // Navigation manuelle au tap
  const handleTap = () => {
    setIsPaused(true);
    stopAutoSlide();
    changeTestimonial();
    
    setTimeout(() => {
      setIsPaused(false);
      startAutoSlide();
    }, 3000);
  };

  const currentTestimonial = testimonials[currentIndex];

  return (
    <View style={styles.carouselContainer}>
      <TouchableWithoutFeedback onPress={handleTap}>
        <Animated.View
          style={[
            styles.testimonialCard,
            {
              opacity: fadeAnim,
            },
          ]}
        >
          <View style={styles.cardContent}>
            <View style={styles.textContent}>
              {/* 5 étoiles */}
              <View style={styles.starsContainer}>
                {[...Array(5)].map((_, index) => (
                  <Text key={index} style={styles.star}>★</Text>
                ))}
              </View>
              <Text style={styles.quote}>"{currentTestimonial.quote}"</Text>
              <View style={styles.authorInfo}>
                <Text style={styles.name}>{currentTestimonial.name}</Text>
                <Text style={styles.role}>{currentTestimonial.role}</Text>
              </View>
            </View>
          </View>
        </Animated.View>
      </TouchableWithoutFeedback>

      {/* Indicateurs de pagination FIXES */}
      <View style={styles.pagination}>
        {testimonials.map((_, index) => (
          <View
            key={index}
            style={[
              styles.paginationDot,
              {
                backgroundColor: index === currentIndex
                  ? '#FFD700'
                  : 'rgba(255, 255, 255, 0.3)',
                // TAILLE FIXE - plus de resizing
                width: 8,
                height: 8,
              }
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  carouselContainer: {
    position: 'absolute',
    top: '33%',
    left: '5%',
    right: '5%',
    zIndex: 6,
    alignItems: 'center',
  },
  testimonialCard: {
    width: '100%',
    maxWidth: width * 0.85,
    // HAUTEUR FIXE pour éviter le resizing
    minHeight: 160,
  },
  cardContent: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    // HAUTEUR FIXE
    minHeight: 160,
    justifyContent: 'center',
  },
  textContent: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  starsContainer: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  star: {
    fontSize: 16,
    color: '#FFD700',
    marginHorizontal: 2,
    textShadowColor: 'rgba(255, 215, 0, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 4,
  },
  quote: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: '#FFFFFF',
    fontStyle: 'italic',
    marginBottom: 12,
    lineHeight: 20,
    textAlign: 'center',
    // HAUTEUR FIXE pour le texte
    minHeight: 60,
  },
  authorInfo: {
    alignItems: 'center',
  },
  name: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 13,
    color: '#FFD700',
    marginBottom: 2,
  },
  role: {
    fontFamily: 'Poppins-Regular',
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
  },
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    gap: 8,
    // HAUTEUR FIXE pour la pagination
    height: 20,
  },
  paginationDot: {
    // DIMENSIONS FIXES - plus de changement de taille
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
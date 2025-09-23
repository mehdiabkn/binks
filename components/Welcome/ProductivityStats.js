// components/Welcome/CompactStats.js
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
} from 'react-native';
import { useTranslation } from 'react-i18next';

export default function CompactStats() {
  const floatAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const numberAnim = useRef(new Animated.Value(0)).current;
  const [displayNumber, setDisplayNumber] = useState(0);
  const { t } = useTranslation();

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      delay: 600,
      useNativeDriver: true,
    }).start();

    // Animation du nombre avec listener pour mettre à jour l'affichage
    const numberAnimation = Animated.timing(numberAnim, {
      toValue: 65,
      duration: 2000,
      delay: 800,
      useNativeDriver: false,
    });

    // Listener pour mettre à jour le nombre affiché
    const listenerId = numberAnim.addListener(({ value }) => {
      setDisplayNumber(Math.floor(value));
    });

    numberAnimation.start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1,
          duration: 2500,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 2500,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Cleanup
    return () => {
      numberAnim.removeListener(listenerId);
    };
  }, []);

  const floatTranslation = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -5],
  });

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ translateY: floatTranslation }],
        },
      ]}
    >
      <View style={styles.badge}>
        <View style={styles.numberContainer}>
          <Text style={styles.number}>
            +{displayNumber}
          </Text>
          <Text style={styles.percent}>%</Text>
        </View>
        <Text style={styles.label}>
            {t('productivity.enprod')}
          </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginTop: 20, // Descend le composant de 50px
  },
  badge: {
    backgroundColor: '#000000', // Badge totalement opaque
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.4)',
    backdropFilter: 'blur(10px)',
    alignItems: 'center',
  },
  numberContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 2,
  },
  number: {
    fontFamily: 'Poppins-Bold',
    fontSize: 24,
    color: '#FFD700',
    textShadowColor: 'rgba(255, 215, 0, 0.6)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
  percent: {
    fontFamily: 'Poppins-Bold',
    fontSize: 14,
    color: '#FFD700',
    marginLeft: 2,
  },
  label: {
    fontFamily: 'Poppins-Regular',
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.8)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
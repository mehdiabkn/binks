// FICHIER: ./components/Statistics/ProgressBar.js

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';

export default function ProgressBar({ 
  title, 
  percentage, 
  completed, 
  total,
  description 
}) {
  
  const getColor = (percentage) => {
    if (percentage >= 80) return '#4ADE80'; // Vert
    if (percentage >= 60) return '#FFD700'; // Jaune
    if (percentage >= 40) return '#FB923C'; // Orange
    return '#F87171'; // Rouge
  };

  const color = getColor(percentage);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      
      <View style={styles.progressContainer}>
        <View style={styles.progressBg}>
          <View 
            style={[
              styles.progressFill,
              { width: `${percentage}%`, backgroundColor: color }
            ]}
          />
        </View>
        <Text style={[styles.percentage, { color }]}>
          {percentage}%
        </Text>
      </View>

      <Text style={styles.description}>
        {completed} réussies sur {total} au total
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  title: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 18,
    color: '#FFFFFF',
    marginBottom: 16,
    textAlign: 'center',
  },
  progressContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  progressBg: {
    width: '100%',
    height: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressFill: {
    height: '100%',
    borderRadius: 6,
    minWidth: 2,
  },
  percentage: {
    fontFamily: 'Poppins-Bold',
    fontSize: 32,
    marginBottom: 8,
  },
  description: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
  },
});
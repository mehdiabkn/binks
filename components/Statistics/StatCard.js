// FICHIER: ./components/Statistics/StatCard.js

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';

export default function StatCard({ 
  title, 
  emoji, 
  percentage, 
  completed, 
  total, 
  color, 
  isLoading = false 
}) {
  
  if (isLoading) {
    return (
      <View style={[styles.card, { borderLeftColor: color }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={color} />
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.card, { borderLeftColor: color }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.emoji}>{emoji}</Text>
        <Text style={styles.title}>{title}</Text>
      </View>
      
      {/* Pourcentage */}
      <Text style={[styles.percentage, { color }]}>
        {percentage}%
      </Text>
      
      {/* Détails */}
      <Text style={styles.details}>
        {completed} sur {total}
      </Text>
      
      {/* Barre de progression */}
      <View style={styles.progressBar}>
        <View 
          style={[
            styles.progressFill,
            { width: `${percentage}%`, backgroundColor: color }
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderLeftWidth: 4,
    minHeight: 140,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  emoji: {
    fontSize: 20,
    marginRight: 8,
  },
  title: {
    fontFamily: 'Poppins-Bold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  percentage: {
    fontFamily: 'Poppins-Bold',
    fontSize: 28,
    marginBottom: 8,
  },
  details: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 12,
  },
  progressBar: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
    minWidth: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 8,
  },
});
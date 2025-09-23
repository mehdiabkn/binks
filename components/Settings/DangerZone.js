import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useTranslation } from 'react-i18next';

export default function DangerZone({ onAction }) {
  const { t } = useTranslation();

  return (
    <View>
    
    <View style={styles.dangerCard}>
      
      <Text style={styles.dangerTitle}>{t('settings.dangerZone.title')}</Text>
      
      <TouchableOpacity
        style={styles.dangerButton}
        onPress={() => onAction('reset_app')}
      >
        <Text style={styles.dangerIcon}>🔄</Text>
        <View style={styles.dangerContent}>
          <Text style={styles.dangerButtonTitle}>{t('settings.dangerZone.resetApp.title')}</Text>
          <Text style={styles.dangerButtonDescription}>{t('settings.dangerZone.resetApp.description')}</Text>
        </View>
      </TouchableOpacity>
    </View>
    
    </View>

  );
}

const styles = StyleSheet.create({
  dangerCard: {
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: 'rgba(255, 107, 107, 0.3)',
    marginBottom: 20,
  },
  dangerTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 16,
    color: '#FF6B6B',
    marginBottom: 15,
    textAlign: 'center',
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  dangerIcon: {
    fontSize: 20,
    marginRight: 15,
    width: 24,
    textAlign: 'center',
  },
  dangerContent: {
    flex: 1,
  },
  dangerButtonTitle: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: '#FF6B6B',
    marginBottom: 2,
  },
  dangerButtonDescription: {
    fontFamily: 'Poppins-Regular',
    fontSize: 11,
    color: 'rgba(255, 107, 107, 0.8)',
  },
});
// components/Widgets/WidgetManager.js

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Switch,
  Platform
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { NativeWidgetService } from '../../services/nativeWidgetService';

export default function WidgetManager({ mitProgress = 0, metProgress = 0, visible = true }) {
  const { t } = useTranslation();
  const [widgetSupported, setWidgetSupported] = useState(false);
  const [widgetEnabled, setWidgetEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    checkWidgetSupport();
  }, []);

  useEffect(() => {
    if (widgetEnabled) {
      updateWidgetData();
    }
  }, [mitProgress, metProgress, widgetEnabled]);

  const checkWidgetSupport = async () => {
    try {
      const info = await NativeWidgetService.getWidgetInfo();
      setWidgetSupported(info.supported);
      console.log('Widget support info:', info);
    } catch (error) {
      console.error('Erreur vérification widgets:', error);
      setWidgetSupported(false);
    }
  };

  const updateWidgetData = async () => {
    if (!widgetEnabled) return;

    try {
      const result = await NativeWidgetService.scheduleAutoUpdate(mitProgress, metProgress);
      if (result.success && !result.skipped) {
        console.log('Widget mis à jour automatiquement');
      }
    } catch (error) {
      console.error('Erreur auto-update widget:', error);
    }
  };

  const toggleWidget = async () => {
    if (!widgetSupported) {
      Alert.alert(
        'Widgets non supportés',
        Platform.OS === 'ios' 
          ? 'Les widgets nécessitent iOS 14+ et le module natif doit être configuré.'
          : 'Les widgets ne sont pas encore disponibles sur Android.',
        [{ text: 'OK' }]
      );
      return;
    }

    setIsLoading(true);

    try {
      if (!widgetEnabled) {
        // Activer les widgets
        const result = await NativeWidgetService.updateWidget(mitProgress, metProgress);
        
        if (result.success) {
          setWidgetEnabled(true);
          
          // Proposer d'ouvrir les paramètres pour ajouter le widget
          Alert.alert(
            'Widget activé !',
            'Pour voir votre widget sur l\'écran d\'accueil, vous devez l\'ajouter manuellement. Ouvrir les paramètres ?',
            [
              { text: 'Plus tard', style: 'cancel' },
              {
                text: 'Ouvrir paramètres',
                onPress: async () => {
                  const openResult = await NativeWidgetService.promptUserToAddWidget();
                  if (!openResult.success) {
                    Alert.alert('Erreur', 'Impossible d\'ouvrir les paramètres automatiquement');
                  }
                }
              }
            ]
          );
        } else {
          Alert.alert('Erreur', result.error || 'Impossible d\'activer les widgets');
        }
      } else {
        // Désactiver les widgets
        setWidgetEnabled(false);
        Alert.alert(
          'Widget désactivé',
          'Le widget ne sera plus mis à jour. Vous pouvez le supprimer manuellement de votre écran d\'accueil.'
        );
      }
    } catch (error) {
      console.error('Erreur toggle widget:', error);
      Alert.alert('Erreur', 'Problème lors de la configuration des widgets');
    } finally {
      setIsLoading(false);
    }
  };

  const testWidget = async () => {
    try {
      setIsLoading(true);
      const result = await NativeWidgetService.updateWidget(mitProgress, metProgress, {
        test: true,
        timestamp: Date.now()
      });
      
      if (result.success) {
        Alert.alert('Test réussi', 'Widget mis à jour ! Vérifiez votre écran d\'accueil.');
      } else {
        Alert.alert('Test échoué', result.error || 'Erreur inconnue');
      }
    } catch (error) {
      Alert.alert('Erreur', 'Erreur lors du test');
    } finally {
      setIsLoading(false);
    }
  };

  if (!visible) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Widget écran d'accueil</Text>
          <Text style={styles.subtitle}>
            {Platform.OS === 'ios' ? 'iOS Widget' : 'Android (bientôt)'}
          </Text>
        </View>
        
        <Switch
          value={widgetEnabled && widgetSupported}
          onValueChange={toggleWidget}
          disabled={isLoading || !widgetSupported}
          trackColor={{ false: '#767577', true: '#FFD700' }}
          thumbColor={widgetEnabled ? '#FFF' : '#f4f3f4'}
        />
      </View>

      {/* Aperçu du widget */}
      <View style={styles.previewContainer}>
        <Text style={styles.previewLabel}>Aperçu widget:</Text>
        
        <View style={styles.widgetPreview}>
          <View style={styles.widgetHeader}>
            <Text style={styles.widgetTitle}>Habitus</Text>
            <Text style={styles.widgetTime}>
              {new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
          
          <View style={styles.progressContainer}>
            <View style={styles.progressItem}>
              <View style={styles.progressLabel}>
                <Text style={styles.progressText}>MIT</Text>
                <Text style={styles.progressPercent}>{Math.round(mitProgress * 100)}%</Text>
              </View>
              <View style={styles.progressBarContainer}>
                <View 
                  style={[styles.progressBar, styles.mitProgressBar, { width: `${mitProgress * 100}%` }]} 
                />
              </View>
            </View>
            
            <View style={styles.progressItem}>
              <View style={styles.progressLabel}>
                <Text style={styles.progressText}>MET</Text>
                <Text style={styles.progressPercent}>{Math.round(metProgress * 100)}%</Text>
              </View>
              <View style={styles.progressBarContainer}>
                <View 
                  style={[styles.progressBar, styles.metProgressBar, { width: `${metProgress * 100}%` }]} 
                />
              </View>
            </View>
          </View>
          
          <Text style={styles.motivationalText}>
            {NativeWidgetService.generateMotivationalMessage(mitProgress, metProgress)}
          </Text>
        </View>
      </View>

      {/* Actions */}
      {widgetEnabled && widgetSupported && (
        <View style={styles.actions}>
          <TouchableOpacity 
            style={styles.testButton} 
            onPress={testWidget}
            disabled={isLoading}
          >
            <Text style={styles.testButtonText}>
              {isLoading ? 'Test...' : 'Tester widget'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Info */}
      <Text style={styles.infoText}>
        {widgetSupported 
          ? 'Le widget s\'affiche sur votre écran d\'accueil et se met à jour automatiquement.'
          : Platform.OS === 'ios' 
            ? 'Nécessite iOS 14+ et la configuration du module natif.'
            : 'Widgets Android en développement.'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
    marginVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontFamily: 'Poppins-Medium',
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: 'rgba(255, 255, 255, 0.6)',
  },
  previewContainer: {
    marginBottom: 16,
  },
  previewLabel: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 8,
  },
  widgetPreview: {
    backgroundColor: 'rgba(15, 15, 35, 0.8)',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  widgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  widgetTitle: {
    fontSize: 12,
    fontFamily: 'Poppins-Bold',
    color: '#FFD700',
  },
  widgetTime: {
    fontSize: 10,
    fontFamily: 'Poppins-Medium',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  progressContainer: {
    marginBottom: 12,
  },
  progressItem: {
    marginBottom: 8,
  },
  progressLabel: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  progressText: {
    fontSize: 11,
    fontFamily: 'Poppins-Semibold',
    color: '#FFFFFF',
  },
  progressPercent: {
    fontSize: 11,
    fontFamily: 'Poppins-Bold',
    color: '#FFD700',
  },
  progressBarContainer: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
  },
  mitProgressBar: {
    backgroundColor: '#FFD700',
  },
  metProgressBar: {
    backgroundColor: '#7FB3FF',
  },
  motivationalText: {
    fontSize: 10,
    fontFamily: 'Poppins-Medium',
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 12,
  },
  testButton: {
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  testButtonText: {
    fontSize: 12,
    fontFamily: 'Poppins-Medium',
    color: '#FFD700',
  },
  infoText: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: 'rgba(255, 255, 255, 0.5)',
    lineHeight: 16,
    textAlign: 'center',
  },
});
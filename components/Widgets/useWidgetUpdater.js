// components/Widgets/useWidgetUpdater.js

import { useEffect, useRef, useCallback } from 'react';
import { AppState } from 'react-native';
import { LockScreenWidgetService } from '../../services/lockScreenWidgetService';

/**
 * Hook pour gérer la synchronisation automatique des widgets
 * avec les changements de données dans l'app
 */
export const useWidgetUpdater = (dependencies = []) => {
  const appState = useRef(AppState.currentState);
  const lastUpdate = useRef(null);
  const updateTimeout = useRef(null);

  // Fonction de mise à jour avec debounce pour éviter les appels trop fréquents
  const debouncedUpdate = useCallback(() => {
    if (updateTimeout.current) {
      clearTimeout(updateTimeout.current);
    }

    updateTimeout.current = setTimeout(async () => {
      try {
        console.log('📱 Mise à jour widgets depuis l\'app...');
        const result = await LockScreenWidgetService.forceUpdate();
        
        if (result.success) {
          lastUpdate.current = new Date();
          console.log('✅ Widgets mis à jour avec succès');
        } else {
          console.error('❌ Échec mise à jour widgets:', result.error);
        }
      } catch (error) {
        console.error('❌ Erreur mise à jour widgets:', error);
      }
    }, 1000); // Debounce de 1 seconde

  }, []);

  // Gérer les changements d'état de l'app
  useEffect(() => {
    const handleAppStateChange = (nextAppState) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        // App revient au premier plan, mettre à jour si nécessaire
        const now = new Date();
        const timeSinceLastUpdate = lastUpdate.current 
          ? now - lastUpdate.current 
          : Infinity;

        // Mettre à jour si plus de 5 minutes se sont écoulées
        if (timeSinceLastUpdate > 5 * 60 * 1000) {
          debouncedUpdate();
        }
      } else if (nextAppState.match(/inactive|background/)) {
        // App passe en arrière-plan, mettre à jour immédiatement
        debouncedUpdate();
      }

      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription?.remove();
      if (updateTimeout.current) {
        clearTimeout(updateTimeout.current);
      }
    };
  }, [debouncedUpdate]);

  // Mettre à jour quand les dépendances changent
  useEffect(() => {
    if (dependencies.length > 0) {
      debouncedUpdate();
    }
  }, dependencies);

  // Fonction pour forcer une mise à jour manuelle
  const forceUpdate = useCallback(async () => {
    try {
      console.log('🔄 Mise à jour manuelle widgets...');
      const result = await LockScreenWidgetService.forceUpdate();
      lastUpdate.current = new Date();
      return result;
    } catch (error) {
      console.error('❌ Erreur mise à jour manuelle:', error);
      return { success: false, error: error.message };
    }
  }, []);

  return {
    forceUpdate,
    lastUpdate: lastUpdate.current
  };
};
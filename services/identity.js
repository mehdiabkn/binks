// services/identity.js
import * as Keychain from 'react-native-keychain';
import uuid from 'react-native-uuid';

const DEVICE_ID_KEY = 'habitus_device_id';
const SERVICE_NAME = 'habitus_identity';

/**
 * Récupère ou génère un deviceId unique et persistant
 * Stocké de manière sécurisée dans le Keychain (iOS) / Keystore (Android)
 */
export async function getDeviceId() {
  try {
    // Tenter de récupérer l'ID existant
    const existingCredentials = await Keychain.getGenericPassword({ 
      service: SERVICE_NAME 
    });
    
    if (existingCredentials && existingCredentials.password) {
      console.log('Device ID récupéré:', existingCredentials.password);
      return existingCredentials.password;
    }
    
    // Générer un nouvel ID si aucun n'existe
    const newDeviceId = uuid.v4();
    
    // Stocker de manière sécurisée
    await Keychain.setGenericPassword(
      DEVICE_ID_KEY, 
      newDeviceId, 
      { 
        service: SERVICE_NAME,
        accessible: Keychain.ACCESSIBLE.ALWAYS_THIS_DEVICE_ONLY,
      }
    );
    
    console.log('Nouveau Device ID généré:', newDeviceId);
    return newDeviceId;
    
  } catch (error) {
    console.error('Erreur lors de la gestion du device ID:', error);
    // En cas d'erreur critique, générer un ID temporaire
    return uuid.v4();
  }
}

/**
 * Supprime l'identité stockée (utile pour le reset/debug)
 */
export async function clearDeviceId() {
  try {
    await Keychain.resetGenericPassword({ service: SERVICE_NAME });
    console.log('Device ID supprimé');
    return true;
  } catch (error) {
    console.error('Erreur lors de la suppression du device ID:', error);
    return false;
  }
}
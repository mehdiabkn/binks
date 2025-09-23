// FICHIER: ./services/authService.js

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  APPLE_USER: '@habitus_apple_user',
  APPLE_LINKED: '@habitus_apple_linked',
};

export class AuthService {
  
  // Apple Sign-in désactivé (nécessite un compte développeur payant)
  static async isAppleSignInAvailable() {
    console.log('Apple Sign-in désactivé - compte développeur requis');
    return false;
  }

  static async isAppleAccountLinked() {
    return false;
  }

  static async linkAppleAccount() {
    return {
      success: false,
      error: 'unavailable',
      message: 'Apple Sign-in nécessite un compte développeur Apple payant'
    };
  }

  static async getLinkedAppleAccount() {
    return null;
  }

  static async unlinkAppleAccount() {
    return { success: true };
  }

  static async checkAppleAuthStatus() {
    return { status: 'not_available' };
  }

  static async syncWithSupabase(supabaseUserId) {
    return { success: false, message: 'Apple Auth non disponible' };
  }
}
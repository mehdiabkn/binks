// FICHIER: ./services/userService.js

import { supabase } from './supabase';

export class UserService {
  
  // 🎯 Notre première route : récupérer tous les utilisateurs
  static async getAllUsers() {
    try {
      console.log('🔍 Récupération des utilisateurs...');
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Erreur Supabase:', error);
        throw error;
      }

      console.log('✅ Utilisateurs récupérés:', data?.length || 0);
      return { success: true, users: data || [] };
      
    } catch (error) {
      console.error('❌ Erreur service:', error.message);
      return { 
        success: false, 
        error: error.message,
        users: []
      };
    }
  }

  // 🎯 Bonus : Créer un utilisateur de test
  static async createTestUser() {
    try {
      const testUser = {
        device_id: `test-${Date.now()}`,
        first_name: 'Test User',
        level: 1,
        xp: 0,
        current_streak: 0,
        is_premium: false
      };

      console.log('🔨 Création utilisateur test...');
      
      const { data, error } = await supabase
        .from('users')
        .insert([testUser])
        .select()
        .single();

      if (error) {
        console.error('❌ Erreur création:', error);
        throw error;
      }

      console.log('✅ Utilisateur créé:', data);
      return { success: true, user: data };
      
    } catch (error) {
      console.error('❌ Erreur création:', error.message);
      return { success: false, error: error.message };
    }
  }
}
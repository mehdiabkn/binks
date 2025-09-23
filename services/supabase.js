// FICHIER: ./services/supabase.js

import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hzlyhvvxeilecqbfjrvk.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh6bHlodnZ4ZWlsZWNxYmZqcnZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU0MzY1MjUsImV4cCI6MjA3MTAxMjUyNX0.u7qNdE4--uLNr8DOEkO8anz6EKpi7zVnOahha49Ag_M';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
  },
});
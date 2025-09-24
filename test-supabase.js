// FICHIER: ./test-supabase.js
// Créez ce fichier à la racine de votre projet HabitusIOS

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();


// 🔥 REMPLACEZ CES VALEURS PAR LES VÔTRES
const supabaseUrl = process.env.SUPABASE_URL
const supabaseAnonKey = process.env.SUPABASE_SERVICE_KEY
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testSupabase() {
  console.log('🚀 Test de connexion Supabase...\n');

  try {
    // Test 1: Récupérer tous les utilisateurs
    console.log('📋 Test 1: Récupération des utilisateurs');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (usersError) {
      console.error('❌ Erreur récupération:', usersError.message);
      return;
    }

    console.log(`✅ ${users.length} utilisateur(s) trouvé(s):`);
    users.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.first_name} (${user.device_id})`);
      console.log(`      Level: ${user.level} | XP: ${user.xp} | Streak: ${user.current_streak}`);
      console.log(`      Premium: ${user.is_premium ? '👑' : '🆓'} | Créé: ${new Date(user.created_at).toLocaleDateString()}`);
      console.log('');
    });

    // Test 2: Créer un utilisateur de test
    console.log('\n🔨 Test 2: Création d\'un utilisateur de test');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const testUser = {
      device_id: `test-${Date.now()}`,
      first_name: 'Test User',
      level: 1,
      xp: 0,
      current_streak: 0,
      is_premium: false
    };

    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert([testUser])
      .select()
      .single();

    if (createError) {
      console.error('❌ Erreur création:', createError.message);
      return;
    }

    console.log('✅ Utilisateur créé avec succès:');
    console.log(`   ID: ${newUser.id}`);
    console.log(`   Nom: ${newUser.first_name}`);
    console.log(`   Device ID: ${newUser.device_id}`);
    console.log(`   Créé: ${new Date(newUser.created_at).toLocaleString()}`);

    // Test 3: Vérifier le total après création
    console.log('\n📊 Test 3: Vérification du total');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const { count, error: countError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('❌ Erreur comptage:', countError.message);
      return;
    }

    console.log(`✅ Total des utilisateurs: ${count}`);

    // Test 4: Test de mise à jour
    console.log('\n🔄 Test 4: Mise à jour de l\'utilisateur créé');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({ 
        xp: 100,
        level: 2,
        current_streak: 5
      })
      .eq('id', newUser.id)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Erreur mise à jour:', updateError.message);
      return;
    }

    console.log('✅ Utilisateur mis à jour:');
    console.log(`   XP: ${testUser.xp} → ${updatedUser.xp}`);
    console.log(`   Level: ${testUser.level} → ${updatedUser.level}`);
    console.log(`   Streak: ${testUser.current_streak} → ${updatedUser.current_streak}`);

    console.log('\n🎉 TOUS LES TESTS PASSÉS AVEC SUCCÈS ! 🎉');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Connexion Supabase: OK');
    console.log('✅ Lecture des données: OK');
    console.log('✅ Création de données: OK');
    console.log('✅ Mise à jour des données: OK');
    console.log('✅ Votre setup est prêt ! 🚀');

  } catch (error) {
    console.error('\n💥 ERREUR GÉNÉRALE:', error.message);
    console.log('\n🔧 VÉRIFICATIONS À FAIRE:');
    console.log('   1. Vos clés Supabase sont-elles correctes ?');
    console.log('   2. La table "users" existe-t-elle ?');
    console.log('   3. RLS est-il désactivé ou configuré ?');
    console.log('   4. Avez-vous installé @supabase/supabase-js ?');
  }
}

// Lancer le test
testSupabase();
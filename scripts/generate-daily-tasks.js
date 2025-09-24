// FICHIER: ./scripts/generate-daily-tasks.js

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Configuration Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement Supabase manqouantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Génère les tâches quotidiennes depuis les templates récurrents
 */
async function generateDailyTasks() {
  try {
    console.log('🤖 [GITHUB ACTION] Début génération tâches quotidiennes');
    
    // Déterminer la date cible (demain par défaut, ou date spécifiée)
    let targetDate;
    if (process.env.TARGET_DATE) {
      targetDate = process.env.TARGET_DATE;
      console.log(`🎯 Date cible spécifiée: ${targetDate}`);
    } else {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      targetDate = tomorrow.toISOString().split('T')[0];
      console.log(`🎯 Date cible (demain): ${targetDate}`);
    }

    // Obtenir le jour de la semaine (1=Lundi, 7=Dimanche)
    const date = new Date(targetDate);
    const dayOfWeek = date.getDay();
    const normalizedDayOfWeek = dayOfWeek === 0 ? 7 : dayOfWeek;
    const dayNames = ['', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
    
    console.log(`📅 ${targetDate} = ${dayNames[normalizedDayOfWeek]} (${normalizedDayOfWeek})`);

    // Récupérer tous les templates actifs qui correspondent à ce jour
    console.log(`🔍 Recherche templates pour le jour ${normalizedDayOfWeek}...`);
    
    const { data: templates, error } = await supabase
      .from('recurring_templates')
      .select('*')
      .eq('is_active', true)
      .contains('days_of_week', [normalizedDayOfWeek]);

    if (error) {
      throw error;
    }

    console.log(`📋 ${templates?.length || 0} templates trouvés pour ce jour`);

    if (!templates || templates.length === 0) {
      console.log('✅ Aucun template à traiter, fin du processus');
      return {
        success: true,
        processed: 0,
        generated: { mits: 0, mets: 0 },
        skipped: 0
      };
    }

    // Statistiques
    let processedCount = 0;
    let generatedMITs = 0;
    let generatedMETs = 0;
    let skippedCount = 0;

    // Grouper les templates par utilisateur pour de meilleures performances
    const templatesByUser = {};
    templates.forEach(template => {
      if (!templatesByUser[template.user_id]) {
        templatesByUser[template.user_id] = [];
      }
      templatesByUser[template.user_id].push(template);
    });

    console.log(`👥 Templates regroupés pour ${Object.keys(templatesByUser).length} utilisateurs`);

    // Traiter chaque utilisateur
    for (const [userId, userTemplates] of Object.entries(templatesByUser)) {
      console.log(`\n🧑‍💼 Traitement utilisateur ${userId} (${userTemplates.length} templates):`);

      for (const template of userTemplates) {
        try {
          processedCount++;
          
          console.log(`  ${processedCount}. ${template.type}: "${template.text}"`);

          if (template.type === 'MIT') {
            // Vérifier si une MIT existe déjà pour cette date
            const { data: existingMIT } = await supabase
              .from('mits')
              .select('id')
              .eq('user_id', userId)
              .eq('text', template.text)
              .eq('start_date', targetDate)
              .single();

            if (existingMIT) {
              console.log(`    ⚠️  MIT existe déjà, ignorée`);
              skippedCount++;
              continue;
            }

            // Créer la nouvelle MIT
            const { data: newMIT, error: mitError } = await supabase
              .from('mits')
              .insert([{
                user_id: userId,
                text: template.text,
                priority: template.priority,
                estimated_time: template.estimated_time,
                is_recurring: false,
                start_date: targetDate,
                end_date: targetDate,
                is_active: true
              }])
              .select()
              .single();

            if (mitError) {
              console.error(`    ❌ Erreur création MIT:`, mitError.message);
              continue;
            }

            console.log(`    ✅ MIT créée (ID: ${newMIT.id})`);
            generatedMITs++;

          } else if (template.type === 'MET') {
            // Vérifier si une MET existe déjà pour cette date
            const { data: existingMET } = await supabase
              .from('mets')
              .select('id')
              .eq('user_id', userId)
              .eq('text', template.text)
              .eq('start_date', targetDate)
              .single();

            if (existingMET) {
              console.log(`    ⚠️  MET existe déjà, ignorée`);
              skippedCount++;
              continue;
            }

            // Créer la nouvelle MET
            const { data: newMET, error: metError } = await supabase
              .from('mets')
              .insert([{
                user_id: userId,
                text: template.text,
                is_recurring: false,
                start_date: targetDate,
                end_date: targetDate,
                is_active: true
              }])
              .select()
              .single();

            if (metError) {
              console.error(`    ❌ Erreur création MET:`, metError.message);
              continue;
            }

            console.log(`    ✅ MET créée (ID: ${newMET.id})`);
            generatedMETs++;
          }

        } catch (templateError) {
          console.error(`    ❌ Erreur template ${template.id}:`, templateError.message);
        }
      }
    }

    // Rapport final
    console.log('\n🎯 RAPPORT FINAL:');
    console.log(`📊 Templates traités: ${processedCount}`);
    console.log(`✅ MIT générées: ${generatedMITs}`);
    console.log(`❌ MET générées: ${generatedMETs}`);
    console.log(`⚠️  Ignorées (existe déjà): ${skippedCount}`);
    console.log(`📅 Date cible: ${targetDate} (${dayNames[normalizedDayOfWeek]})`);

    return {
      success: true,
      processed: processedCount,
      generated: { mits: generatedMITs, mets: generatedMETs },
      skipped: skippedCount,
      targetDate
    };

  } catch (error) {
    console.error('❌ Erreur génération tâches quotidiennes:', error);
    throw error;
  }
}

/**
 * Nettoyage optionnel des anciennes tâches générées
 */
async function cleanupOldTasks() {
  try {
    console.log('\n🧹 Nettoyage des anciennes tâches...');
    
    // Supprimer les tâches générées de plus de 90 jours
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 90);
    const cutoffDateStr = cutoffDate.toISOString().split('T')[0];
    
    const [mitCleanup, metCleanup] = await Promise.all([
      supabase
        .from('mits')
        .delete()
        .eq('is_recurring', false)
        .eq('is_active', true)
        .lt('start_date', cutoffDateStr),
      
      supabase
        .from('mets')
        .delete()
        .eq('is_recurring', false)
        .eq('is_active', true)
        .lt('start_date', cutoffDateStr)
    ]);

    let cleanedCount = 0;
    if (mitCleanup.error) {
      console.error('❌ Erreur nettoyage MIT:', mitCleanup.error);
    } else {
      cleanedCount += mitCleanup.count || 0;
    }

    if (metCleanup.error) {
      console.error('❌ Erreur nettoyage MET:', metCleanup.error);
    } else {
      cleanedCount += metCleanup.count || 0;
    }

    console.log(`🧹 ${cleanedCount} anciennes tâches supprimées (> 90 jours)`);
    
  } catch (error) {
    console.error('❌ Erreur nettoyage:', error);
    // Ne pas faire échouer le processus principal
  }
}

// Exécution du script
async function main() {
  const startTime = Date.now();
  
  try {
    console.log('🚀 [GITHUB ACTION] Démarrage...');
    console.log(`🕒 Heure UTC: ${new Date().toISOString()}`);
    
    // Génération des tâches
    const result = await generateDailyTasks();
    
    // Nettoyage (optionnel)
    await cleanupOldTasks();
    
    const duration = Math.round((Date.now() - startTime) / 1000);
    console.log(`\n✅ [GITHUB ACTION] Terminé en ${duration}s`);
    
    // Sortie avec code de succès
    process.exit(0);
    
  } catch (error) {
    console.error('\n💥 [GITHUB ACTION] Échec critique:', error);
    
    // Sortie avec code d'erreur
    process.exit(1);
  }
}

// Point d'entrée
if (require.main === module) {
  main();
}
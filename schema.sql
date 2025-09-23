-- ================================================
-- SCHÉMA POSTGRESQL COMPLET - APPLICATION HABITUS
-- Script SQL propre et fonctionnel
-- ================================================

-- Extensions nécessaires
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ================================================
-- TYPES ENUM
-- ================================================
CREATE TYPE objective_category AS ENUM ('personal', 'professional', 'health', 'learning');
CREATE TYPE objective_priority AS ENUM ('low', 'medium', 'high');
CREATE TYPE objective_progress_type AS ENUM ('simple', 'incremental', 'continuous');
CREATE TYPE task_category AS ENUM ('work', 'health', 'personal', 'learning');
CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high');
CREATE TYPE task_status AS ENUM ('current', 'completed', 'archived');
CREATE TYPE mit_priority AS ENUM ('low', 'medium', 'high');
CREATE TYPE subscription_status AS ENUM ('active', 'expired', 'cancelled', 'trial');

-- ================================================
-- 1. TABLE USERS
-- ================================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id VARCHAR(255) UNIQUE NOT NULL,
    apple_id VARCHAR(255),
    
    -- Informations personnelles
    first_name VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    
    -- Système de progression
    level INTEGER DEFAULT 1 CHECK (level >= 1),
    xp INTEGER DEFAULT 0 CHECK (xp >= 0),
    current_streak INTEGER DEFAULT 0 CHECK (current_streak >= 0),
    
    -- Statut premium
    is_premium BOOLEAN DEFAULT FALSE,
    subscription_date TIMESTAMP WITH TIME ZONE,
    package_purchased VARCHAR(100),
    
    -- Métadonnées
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================
-- 2. TABLE ONBOARDING_RESPONSES
-- ================================================
CREATE TABLE onboarding_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Réponses structurées par question
    question_1_name TEXT,
    question_3_categories TEXT[],
    question_4_current_level VARCHAR(50),
    question_5_target_level VARCHAR(50),
    question_6_timeline VARCHAR(50),
    question_7_distance VARCHAR(50),
    question_9_motivation TEXT,
    question_11_mit TEXT,
    question_12_met TEXT,
    question_13_signature TEXT,
    question_14_pricing_choice VARCHAR(50),
    
    -- Métadonnées
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================
-- 3. TABLE OBJECTIVES
-- ================================================
CREATE TABLE objectives (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Contenu de l'objectif
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category objective_category NOT NULL,
    priority objective_priority DEFAULT 'medium',
    
    -- Système de progression
    progress_type objective_progress_type NOT NULL,
    has_target BOOLEAN DEFAULT TRUE,
    target_value DECIMAL(10,2) DEFAULT 1,
    current_value DECIMAL(10,2) DEFAULT 0,
    unit VARCHAR(50),
    
    -- Dates importantes
    deadline DATE,
    completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Métadonnées
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Contraintes
    CHECK (current_value >= 0),
    CHECK (target_value > 0),
    CHECK (current_value <= target_value OR NOT has_target)
);

-- ================================================
-- 4. TABLE OBJECTIVE_MILESTONES
-- ================================================
CREATE TABLE objective_milestones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    objective_id UUID REFERENCES objectives(id) ON DELETE CASCADE,
    
    -- Données du jalon
    label VARCHAR(255) NOT NULL,
    value DECIMAL(10,2) NOT NULL,
    completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Métadonnées
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Contraintes
    CHECK (value > 0),
    UNIQUE(objective_id, value)
);

-- ================================================
-- 5. TABLE TASKS
-- ================================================
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    objective_id UUID REFERENCES objectives(id) ON DELETE SET NULL,
    
    -- Contenu de la tâche
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category task_category NOT NULL,
    priority task_priority DEFAULT 'medium',
    
    -- Progression et temps
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    estimated_time INTEGER,
    
    -- État de la tâche
    status task_status DEFAULT 'current',
    completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Métadonnées
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================
-- 6. TABLE MITS (Most Important Tasks)
-- ================================================
CREATE TABLE mits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Contenu de la MIT
    text TEXT NOT NULL,
    priority mit_priority DEFAULT 'medium',
    estimated_time VARCHAR(20),
    
    -- Récurrence simple
    is_recurring BOOLEAN DEFAULT FALSE,
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    end_date DATE,
    
    -- État
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Métadonnées
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================
-- 7. TABLE METS (Most Emotional Tasks)
-- ================================================
CREATE TABLE mets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Contenu de la MET
    text TEXT NOT NULL,
    
    -- Récurrence simple
    is_recurring BOOLEAN DEFAULT FALSE,
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    end_date DATE,
    
    -- État
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Métadonnées
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================
-- 8. TABLE MIT_COMPLETIONS
-- ================================================
CREATE TABLE mit_completions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    mit_id UUID REFERENCES mits(id) ON DELETE CASCADE,
    
    -- Jour où c'est fait
    date DATE NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Contrainte unicité
    UNIQUE(user_id, mit_id, date)
);

-- ================================================
-- 9. TABLE MET_CHECKS
-- ================================================
CREATE TABLE met_checks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    met_id UUID REFERENCES mets(id) ON DELETE CASCADE,
    
    -- Jour où on a fait la chose à éviter
    date DATE NOT NULL,
    checked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Contrainte unicité
    UNIQUE(user_id, met_id, date)
);

-- ================================================
-- 10. TABLE DAILY_ACHIEVEMENTS
-- ================================================
CREATE TABLE daily_achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Accomplissement majeur du jour
    date DATE NOT NULL,
    achievement_text TEXT NOT NULL,
    
    -- Métadonnées
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Contrainte unicité
    UNIQUE(user_id, date)
);

-- ================================================
-- 11. TABLE DAILY_SCORES
-- ================================================
CREATE TABLE daily_scores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Score du jour
    date DATE NOT NULL,
    score INTEGER DEFAULT 0 CHECK (score >= 0),
    
    -- Compteurs MIT/MET
    mits_completed INTEGER DEFAULT 0,
    total_mits INTEGER DEFAULT 0,
    mets_avoided INTEGER DEFAULT 0,
    total_mets INTEGER DEFAULT 0,
    
    -- Autres compteurs
    tasks_completed INTEGER DEFAULT 0,
    total_tasks INTEGER DEFAULT 0,
    objectives_updated INTEGER DEFAULT 0,
    
    -- Métadonnées
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Contrainte unicité
    UNIQUE(user_id, date)
);

-- ================================================
-- 12. TABLE USER_STATISTICS
-- ================================================
CREATE TABLE user_statistics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Statistiques générales
    total_login_days INTEGER DEFAULT 0,
    total_tasks_completed INTEGER DEFAULT 0,
    total_objectives_completed INTEGER DEFAULT 0,
    average_daily_score DECIMAL(5,2) DEFAULT 0,
    
    -- Préférences
    favorite_category objective_category,
    best_streak INTEGER DEFAULT 0,
    
    -- Dates importantes
    member_since DATE DEFAULT CURRENT_DATE,
    last_calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Contrainte unicité
    UNIQUE(user_id)
);

-- ================================================
-- 13. TABLE NOTIFICATION_SETTINGS
-- ================================================
CREATE TABLE notification_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Paramètres notifications
    notifications_enabled BOOLEAN DEFAULT TRUE,
    daily_reminder BOOLEAN DEFAULT TRUE,
    weekly_report BOOLEAN DEFAULT FALSE,
    objective_reminders BOOLEAN DEFAULT TRUE,
    celebration_notifications BOOLEAN DEFAULT TRUE,
    
    -- Timing
    daily_reminder_time TIME DEFAULT '09:00:00',
    weekly_report_day INTEGER DEFAULT 7 CHECK (weekly_report_day BETWEEN 1 AND 7),
    
    -- Métadonnées
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Contrainte unicité
    UNIQUE(user_id)
);

-- ================================================
-- 14. TABLE APP_SETTINGS
-- ================================================
CREATE TABLE app_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Paramètres interface
    dark_mode BOOLEAN DEFAULT TRUE,
    haptic_feedback BOOLEAN DEFAULT TRUE,
    language VARCHAR(10) DEFAULT 'fr',
    
    -- Paramètres données
    analytics_tracking BOOLEAN DEFAULT TRUE,
    auto_backup BOOLEAN DEFAULT FALSE,
    
    -- Métadonnées
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Contrainte unicité
    UNIQUE(user_id)
);

-- ================================================
-- 15. TABLE SUBSCRIPTION_HISTORY
-- ================================================
CREATE TABLE subscription_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Détails abonnement
    package_identifier VARCHAR(100) NOT NULL,
    status subscription_status NOT NULL,
    
    -- Dates importantes
    started_at TIMESTAMP WITH TIME ZONE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    
    -- Informations RevenueCat
    revenue_cat_customer_id VARCHAR(255),
    original_transaction_id VARCHAR(255),
    
    -- Métadonnées
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================
-- INDEX POUR PERFORMANCE
-- ================================================

-- Index users
CREATE INDEX idx_users_device_id ON users(device_id);
CREATE INDEX idx_users_last_login ON users(last_login_at);

-- Index objectives
CREATE INDEX idx_objectives_user_completed ON objectives(user_id, completed);
CREATE INDEX idx_objectives_user_category ON objectives(user_id, category);
CREATE INDEX idx_objectives_deadline ON objectives(deadline) WHERE deadline IS NOT NULL;

-- Index tasks
CREATE INDEX idx_tasks_user_status ON tasks(user_id, status);
CREATE INDEX idx_tasks_user_category ON tasks(user_id, category);
CREATE INDEX idx_tasks_objective ON tasks(objective_id) WHERE objective_id IS NOT NULL;

-- Index MIT/MET
CREATE INDEX idx_mits_user_active ON mits(user_id, is_active);
CREATE INDEX idx_mits_user_recurring ON mits(user_id, is_recurring);
CREATE INDEX idx_mits_dates ON mits(start_date, end_date);

CREATE INDEX idx_mets_user_active ON mets(user_id, is_active);
CREATE INDEX idx_mets_user_recurring ON mets(user_id, is_recurring);
CREATE INDEX idx_mets_dates ON mets(start_date, end_date);

CREATE INDEX idx_mit_completions_user_date ON mit_completions(user_id, date);
CREATE INDEX idx_mit_completions_mit ON mit_completions(mit_id);

CREATE INDEX idx_met_checks_user_date ON met_checks(user_id, date);
CREATE INDEX idx_met_checks_met ON met_checks(met_id);

-- Index daily data
CREATE INDEX idx_daily_scores_user_date ON daily_scores(user_id, date);
CREATE INDEX idx_daily_scores_date ON daily_scores(date);
CREATE INDEX idx_daily_achievements_user_date ON daily_achievements(user_id, date);

-- Index milestones
CREATE INDEX idx_milestones_objective ON objective_milestones(objective_id);

-- Index subscription
CREATE INDEX idx_subscription_user_status ON subscription_history(user_id, status);

-- ================================================
-- TRIGGERS POUR UPDATED_AT
-- ================================================

-- Fonction trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS 
'BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;'
LANGUAGE plpgsql;

-- Application des triggers
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_objectives_updated_at 
    BEFORE UPDATE ON objectives
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at 
    BEFORE UPDATE ON tasks
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_mits_updated_at 
    BEFORE UPDATE ON mits
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_mets_updated_at 
    BEFORE UPDATE ON mets
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_daily_scores_updated_at 
    BEFORE UPDATE ON daily_scores
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_daily_achievements_updated_at 
    BEFORE UPDATE ON daily_achievements
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_settings_updated_at 
    BEFORE UPDATE ON notification_settings
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_app_settings_updated_at 
    BEFORE UPDATE ON app_settings
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- ================================================
-- COMMENTAIRES POUR DOCUMENTATION
-- ================================================

COMMENT ON TABLE users IS 'Table principale des utilisateurs avec profil et progression';
COMMENT ON TABLE onboarding_responses IS 'Réponses du questionnaire d''onboarding par utilisateur';
COMMENT ON TABLE objectives IS 'Objectifs des utilisateurs avec système de progression flexible';
COMMENT ON TABLE objective_milestones IS 'Jalons/étapes des objectifs pour suivi détaillé';
COMMENT ON TABLE tasks IS 'Tâches quotidiennes liées ou non aux objectifs';
COMMENT ON TABLE mits IS 'MIT (Most Important Tasks) avec récurrence simple via dates';
COMMENT ON TABLE mets IS 'MET (Most Emotional Tasks - choses à éviter) avec récurrence simple';
COMMENT ON TABLE mit_completions IS 'Historique des MIT complétées par jour';
COMMENT ON TABLE met_checks IS 'Historique des MET cochées (faites) par jour';
COMMENT ON TABLE daily_achievements IS 'Accomplissements majeurs quotidiens saisis par l''utilisateur';
COMMENT ON TABLE daily_scores IS 'Scores et métriques quotidiennes incluant MIT/MET';
COMMENT ON TABLE user_statistics IS 'Statistiques agrégées des utilisateurs';
COMMENT ON TABLE notification_settings IS 'Préférences de notifications par utilisateur';
COMMENT ON TABLE app_settings IS 'Paramètres de l''application par utilisateur';
COMMENT ON TABLE subscription_history IS 'Historique des abonnements et statuts premium';

-- ================================================
-- EXEMPLE D'UTILISATION (COMMENTÉ)
-- ================================================

-- Création d'un utilisateur de test
-- INSERT INTO users (device_id, first_name, level, xp, current_streak) 
-- VALUES ('test-device-123', 'Champion', 5, 2840, 7);

-- Ajout d'une MIT récurrente
-- INSERT INTO mits (user_id, text, priority, is_recurring, start_date) 
-- VALUES ((SELECT id FROM users WHERE device_id = 'test-device-123'), 
--         'Faire 30 min d''exercice', 'high', true, CURRENT_DATE);

-- Marquer une MIT comme terminée aujourd'hui
-- INSERT INTO mit_completions (user_id, mit_id, date)
-- VALUES ((SELECT id FROM users WHERE device_id = 'test-device-123'),
--         (SELECT id FROM mits WHERE text = 'Faire 30 min d''exercice'),
--         CURRENT_DATE);

-- ================================================
-- FIN DU SCRIPT
-- ================================================
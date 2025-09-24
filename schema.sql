-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.app_settings (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid UNIQUE,
  dark_mode boolean DEFAULT true,
  haptic_feedback boolean DEFAULT true,
  language character varying DEFAULT 'fr'::character varying,
  analytics_tracking boolean DEFAULT true,
  auto_backup boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT app_settings_pkey PRIMARY KEY (id),
  CONSTRAINT app_settings_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.daily_achievements (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid,
  date date NOT NULL,
  achievement_text text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT daily_achievements_pkey PRIMARY KEY (id),
  CONSTRAINT daily_achievements_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.daily_scores (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid,
  date date NOT NULL,
  score integer DEFAULT 0 CHECK (score >= 0),
  mits_completed integer DEFAULT 0,
  total_mits integer DEFAULT 0,
  mets_avoided integer DEFAULT 0,
  total_mets integer DEFAULT 0,
  tasks_completed integer DEFAULT 0,
  total_tasks integer DEFAULT 0,
  objectives_updated integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT daily_scores_pkey PRIMARY KEY (id),
  CONSTRAINT daily_scores_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.met_checks (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid,
  met_id uuid,
  date date NOT NULL,
  checked_at timestamp with time zone DEFAULT now(),
  CONSTRAINT met_checks_pkey PRIMARY KEY (id),
  CONSTRAINT met_checks_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT met_checks_met_id_fkey FOREIGN KEY (met_id) REFERENCES public.mets(id)
);
CREATE TABLE public.mets (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid,
  text text NOT NULL,
  is_recurring boolean DEFAULT false,
  start_date date NOT NULL DEFAULT CURRENT_DATE,
  end_date date,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  reussi boolean DEFAULT true,
  CONSTRAINT mets_pkey PRIMARY KEY (id),
  CONSTRAINT mets_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.mit_completions (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid,
  mit_id uuid,
  date date NOT NULL,
  completed_at timestamp with time zone DEFAULT now(),
  CONSTRAINT mit_completions_pkey PRIMARY KEY (id),
  CONSTRAINT mit_completions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT mit_completions_mit_id_fkey FOREIGN KEY (mit_id) REFERENCES public.mits(id)
);
CREATE TABLE public.mits (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid,
  text text NOT NULL,
  priority USER-DEFINED DEFAULT 'medium'::mit_priority,
  estimated_time character varying,
  is_recurring boolean DEFAULT false,
  start_date date NOT NULL DEFAULT CURRENT_DATE,
  end_date date,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  reussi boolean DEFAULT false,
  frequency ARRAY,
  CONSTRAINT mits_pkey PRIMARY KEY (id),
  CONSTRAINT mits_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.notification_settings (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid UNIQUE,
  notifications_enabled boolean DEFAULT true,
  daily_reminder boolean DEFAULT true,
  weekly_report boolean DEFAULT false,
  objective_reminders boolean DEFAULT true,
  celebration_notifications boolean DEFAULT true,
  daily_reminder_time time without time zone DEFAULT '09:00:00'::time without time zone,
  weekly_report_day integer DEFAULT 7 CHECK (weekly_report_day >= 1 AND weekly_report_day <= 7),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT notification_settings_pkey PRIMARY KEY (id),
  CONSTRAINT notification_settings_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.objective_milestones (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  objective_id uuid,
  label character varying NOT NULL,
  value numeric NOT NULL CHECK (value > 0::numeric),
  completed boolean DEFAULT false,
  completed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT objective_milestones_pkey PRIMARY KEY (id),
  CONSTRAINT objective_milestones_objective_id_fkey FOREIGN KEY (objective_id) REFERENCES public.objectives(id)
);
CREATE TABLE public.objectives (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid,
  title character varying NOT NULL,
  description text,
  category USER-DEFINED NOT NULL,
  priority USER-DEFINED DEFAULT 'medium'::objective_priority,
  progress_type USER-DEFINED NOT NULL,
  has_target boolean DEFAULT true,
  target_value numeric DEFAULT 1 CHECK (target_value > 0::numeric),
  current_value numeric DEFAULT 0 CHECK (current_value >= 0::numeric),
  unit character varying,
  deadline date,
  completed boolean DEFAULT false,
  completed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT objectives_pkey PRIMARY KEY (id),
  CONSTRAINT objectives_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.onboarding_responses (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid,
  question_1_name text,
  question_3_categories ARRAY,
  question_4_current_level character varying,
  question_5_target_level character varying,
  question_6_timeline character varying,
  question_7_distance character varying,
  question_9_motivation text,
  question_11_mit text,
  question_12_met text,
  question_13_signature text,
  question_14_pricing_choice character varying,
  completed_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT onboarding_responses_pkey PRIMARY KEY (id),
  CONSTRAINT onboarding_responses_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.subscription_history (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid,
  package_identifier character varying NOT NULL,
  status USER-DEFINED NOT NULL,
  started_at timestamp with time zone NOT NULL,
  expires_at timestamp with time zone,
  cancelled_at timestamp with time zone,
  revenue_cat_customer_id character varying,
  original_transaction_id character varying,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT subscription_history_pkey PRIMARY KEY (id),
  CONSTRAINT subscription_history_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.tasks (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid,
  objective_id uuid,
  title character varying NOT NULL,
  description text,
  category USER-DEFINED NOT NULL,
  priority USER-DEFINED DEFAULT 'medium'::task_priority,
  progress integer DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  estimated_time integer,
  status USER-DEFINED DEFAULT 'current'::task_status,
  completed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT tasks_pkey PRIMARY KEY (id),
  CONSTRAINT tasks_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT tasks_objective_id_fkey FOREIGN KEY (objective_id) REFERENCES public.objectives(id)
);
CREATE TABLE public.user_statistics (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid UNIQUE,
  total_login_days integer DEFAULT 0,
  total_tasks_completed integer DEFAULT 0,
  total_objectives_completed integer DEFAULT 0,
  average_daily_score numeric DEFAULT 0,
  favorite_category USER-DEFINED,
  best_streak integer DEFAULT 0,
  member_since date DEFAULT CURRENT_DATE,
  last_calculated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_statistics_pkey PRIMARY KEY (id),
  CONSTRAINT user_statistics_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.users (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  device_id character varying NOT NULL UNIQUE,
  apple_id character varying,
  first_name character varying NOT NULL,
  email character varying,
  level integer DEFAULT 1 CHECK (level >= 1),
  xp integer DEFAULT 0 CHECK (xp >= 0),
  current_streak integer DEFAULT 0 CHECK (current_streak >= 0),
  is_premium boolean DEFAULT false,
  subscription_date timestamp with time zone,
  package_purchased character varying,
  created_at timestamp with time zone DEFAULT now(),
  last_login_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT users_pkey PRIMARY KEY (id)
);
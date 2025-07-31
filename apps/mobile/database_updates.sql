-- Add missing fields to memory_profiles table for AI insights
-- (Only the fields that don't already exist in the schema)
ALTER TABLE public.memory_profiles 
ADD COLUMN emotional_patterns text[],
ADD COLUMN relationship_dynamics text[],
ADD COLUMN growth_opportunities text[],
ADD COLUMN therapeutic_approach text,
ADD COLUMN risk_factors text[],
ADD COLUMN strengths text[];

-- Add description column to session_groups table (code tries to insert 'description' field)
ALTER TABLE public.session_groups 
ADD COLUMN description text;

-- Add specific onboarding data fields to memory_profiles for important data
ALTER TABLE public.memory_profiles 
ADD COLUMN motivation_for_joining text,
ADD COLUMN hopes_to_achieve text,
ADD COLUMN previous_therapy text,
ADD COLUMN therapy_type text,
ADD COLUMN therapy_duration text,
ADD COLUMN sleep_routine text,
ADD COLUMN mood_trends text[],
ADD COLUMN sleep_quality text,
ADD COLUMN mood_score_initial integer,
ADD COLUMN emotional_states_initial text[],
ADD COLUMN suicidal_thoughts_initial text,
ADD COLUMN relationship_status text,
ADD COLUMN living_situation text,
ADD COLUMN support_system text[],
ADD COLUMN current_stressors text[],
ADD COLUMN daily_habits text[],
ADD COLUMN substance_use text[],
ADD COLUMN biggest_challenge text,
ADD COLUMN biggest_obstacle text;

-- Add comment explaining the new fields
COMMENT ON COLUMN public.memory_profiles.emotional_patterns IS 'AI-generated emotional patterns from onboarding analysis';
COMMENT ON COLUMN public.memory_profiles.relationship_dynamics IS 'AI-generated relationship dynamics analysis';
COMMENT ON COLUMN public.memory_profiles.growth_opportunities IS 'AI-identified growth opportunities';
COMMENT ON COLUMN public.memory_profiles.therapeutic_approach IS 'AI-recommended therapeutic approach';
COMMENT ON COLUMN public.memory_profiles.risk_factors IS 'AI-identified risk factors';
COMMENT ON COLUMN public.memory_profiles.strengths IS 'AI-identified user strengths';
COMMENT ON COLUMN public.session_groups.description IS 'Description of the session group';
COMMENT ON COLUMN public.memory_profiles.motivation_for_joining IS 'User motivation for joining Aluuna';
COMMENT ON COLUMN public.memory_profiles.hopes_to_achieve IS 'What user hopes to achieve through therapy';
COMMENT ON COLUMN public.memory_profiles.previous_therapy IS 'Previous therapy experience';
COMMENT ON COLUMN public.memory_profiles.therapy_type IS 'Type of previous therapy';
COMMENT ON COLUMN public.memory_profiles.therapy_duration IS 'Duration of previous therapy';
COMMENT ON COLUMN public.memory_profiles.sleep_routine IS 'User sleep routine';
COMMENT ON COLUMN public.memory_profiles.mood_trends IS 'User mood trends';
COMMENT ON COLUMN public.memory_profiles.sleep_quality IS 'User sleep quality';
COMMENT ON COLUMN public.memory_profiles.mood_score_initial IS 'Initial mood score from onboarding';
COMMENT ON COLUMN public.memory_profiles.emotional_states_initial IS 'Initial emotional states from onboarding';
COMMENT ON COLUMN public.memory_profiles.suicidal_thoughts_initial IS 'Initial suicidal thoughts assessment';
COMMENT ON COLUMN public.memory_profiles.relationship_status IS 'User relationship status';
COMMENT ON COLUMN public.memory_profiles.living_situation IS 'User living situation';
COMMENT ON COLUMN public.memory_profiles.support_system IS 'User support system';
COMMENT ON COLUMN public.memory_profiles.current_stressors IS 'Current stressors in user life';
COMMENT ON COLUMN public.memory_profiles.daily_habits IS 'User daily habits';
COMMENT ON COLUMN public.memory_profiles.substance_use IS 'User substance use';
COMMENT ON COLUMN public.memory_profiles.biggest_challenge IS 'User biggest challenge';
COMMENT ON COLUMN public.memory_profiles.biggest_obstacle IS 'User biggest obstacle to goals'; 
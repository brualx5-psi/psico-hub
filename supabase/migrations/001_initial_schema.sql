-- PsicoHub Database Schema
-- Run this in Supabase SQL Editor

-- Users profile (extends Supabase Auth)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Patients table (core patient info)
CREATE TABLE IF NOT EXISTS patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  name TEXT NOT NULL,
  birth_date DATE,
  email TEXT,
  phone TEXT,
  status TEXT DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo')),
  inactivation_date DATE,
  inactivation_reason TEXT,
  inactivation_notes TEXT,
  primary_disorder TEXT,
  comorbidities TEXT[],
  -- Schedule as JSONB for flexibility
  schedule JSONB,
  -- Billing as JSONB (complex nested structure)
  billing JSONB,
  -- Payment records as JSONB array
  payment_records JSONB DEFAULT '[]',
  -- Scheduled sessions as JSONB array
  scheduled_sessions JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Clinical records (all clinical data for a patient)
CREATE TABLE IF NOT EXISTS clinical_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES patients ON DELETE CASCADE UNIQUE,
  anamnesis JSONB DEFAULT '{"content": "", "history": [], "updatedAt": ""}',
  case_formulation JSONB DEFAULT '{"content": "", "updatedAt": ""}',
  treatment_plan JSONB DEFAULT '{"goals": [], "updatedAt": ""}',
  assessments JSONB DEFAULT '[]',
  custom_protocols JSONB DEFAULT '[]',
  sessions JSONB DEFAULT '[]',
  discharge_criteria JSONB DEFAULT '[]',
  evolution_analysis JSONB DEFAULT '[]',
  chat_history JSONB DEFAULT '[]',
  prontuario_records JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Eells data (case formulation model)
CREATE TABLE IF NOT EXISTS eells_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES patients ON DELETE CASCADE UNIQUE,
  problem_list JSONB DEFAULT '[]',
  problem_list_agreement JSONB,
  mechanisms JSONB,
  formulation JSONB,
  treatment_plan JSONB,
  progress JSONB,
  gas_goals JSONB DEFAULT '[]',
  active_hypothesis JSONB,
  decision_log JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE eells_data ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their own data
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (id = auth.uid());

CREATE POLICY "Users can CRUD own patients" ON patients
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Users can CRUD own clinical records" ON clinical_records
  FOR ALL USING (patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid()));

CREATE POLICY "Users can CRUD own eells data" ON eells_data
  FOR ALL USING (patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid()));

-- Create trigger to auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_patients_updated_at
    BEFORE UPDATE ON patients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clinical_records_updated_at
    BEFORE UPDATE ON clinical_records
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_eells_data_updated_at
    BEFORE UPDATE ON eells_data
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

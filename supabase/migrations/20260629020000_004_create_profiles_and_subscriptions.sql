-- Migration: Create profiles table for subscriptions and billing
-- Adds auto-profile creation on user signup

-- 1. Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  email TEXT,
  full_name TEXT DEFAULT '',
  plan TEXT NOT NULL DEFAULT 'trial' CHECK (plan IN ('trial', 'pro', 'cancelled')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'paused', 'cancelled')),
  trial_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  trial_end TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '14 days'),
  subscribed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  mp_preapproval_id TEXT,
  mp_subscription_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policies: users can only see their own profile, admins can see all
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Allow insert from trigger (service role) and own insert
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_profiles_user_id ON profiles(user_id);
CREATE INDEX idx_profiles_status ON profiles(status);
CREATE INDEX idx_profiles_trial_end ON profiles(trial_end);

-- 2. Function + Trigger: auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', '')
  );
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 3. Function to check if a user's subscription is active
CREATE OR REPLACE FUNCTION public.check_subscription_active(user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  user_profile public.profiles;
BEGIN
  SELECT * INTO user_profile FROM public.profiles WHERE user_id = user_uuid;

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- Active trial (within 14 days)
  IF user_profile.plan = 'trial' AND user_profile.status = 'active' AND now() < user_profile.trial_end THEN
    RETURN TRUE;
  END IF;

  -- Active subscription
  IF user_profile.plan = 'pro' AND user_profile.status = 'active' AND (user_profile.expires_at IS NULL OR now() < user_profile.expires_at) THEN
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$;

-- =============================================================================
-- ISHANT MACRO AI TERMINAL (NEXVORA AI)
-- SUPABASE PRODUCTION DATABASE SCHEMA, RLS POLICIES & SUBSCRIPTION TABLES
-- =============================================================================
-- Execute this script in your Supabase Dashboard -> SQL Editor -> Run
-- =============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. CREATE PUBLIC USER PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  phone TEXT,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'institutional_trader',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- 3. CREATE SUBSCRIPTIONS TABLE
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  plan_id TEXT NOT NULL, -- 'free' | 'monthly' | 'quarterly' | 'half_yearly' | 'annual'
  tier TEXT NOT NULL DEFAULT 'PRO', -- 'FREE' | 'PRO' | 'ELITE'
  amount_inr NUMERIC NOT NULL,
  currency TEXT DEFAULT 'INR' NOT NULL,
  status TEXT DEFAULT 'ACTIVE' NOT NULL, -- 'ACTIVE' | 'PENDING' | 'EXPIRED' | 'CANCELLED'
  start_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  expiry_date TIMESTAMP WITH TIME ZONE NOT NULL,
  payment_provider TEXT DEFAULT 'RAZORPAY' NOT NULL, -- 'RAZORPAY' | 'STRIPE' | 'COMPLIMENTARY'
  payment_id TEXT,
  order_id TEXT,
  auto_renew BOOLEAN DEFAULT TRUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for subscriptions
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own subscriptions" ON public.subscriptions;
CREATE POLICY "Users can view own subscriptions"
  ON public.subscriptions FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own subscriptions" ON public.subscriptions;
CREATE POLICY "Users can insert own subscriptions"
  ON public.subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own subscriptions" ON public.subscriptions;
CREATE POLICY "Users can update own subscriptions"
  ON public.subscriptions FOR UPDATE
  USING (auth.uid() = user_id);

-- 4. CREATE PAYMENT ORDERS AUDIT TABLE
CREATE TABLE IF NOT EXISTS public.payment_orders (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  plan_id TEXT NOT NULL,
  amount_inr NUMERIC NOT NULL,
  currency TEXT DEFAULT 'INR' NOT NULL,
  status TEXT DEFAULT 'CREATED' NOT NULL, -- 'CREATED' | 'PAID' | 'FAILED'
  razorpay_order_id TEXT,
  razorpay_payment_id TEXT,
  razorpay_signature TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.payment_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own payment orders" ON public.payment_orders;
CREATE POLICY "Users can view own payment orders"
  ON public.payment_orders FOR SELECT
  USING (auth.uid() = user_id);

-- 5. AUTOMATIC TRIGGER FOR NEW AUTH USERS
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, phone, full_name, avatar_url, created_at, updated_at)
  VALUES (
    new.id,
    new.email,
    new.phone,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url',
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE
  SET
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
    updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================================================
-- PRODUCTION AUTHENTICATION & PAYMENT PROVIDER CONFIGURATION GUIDE
-- =============================================================================
-- 1. GOOGLE OAUTH 2.0:
--    - Supabase Dashboard -> Authentication -> Providers -> Google -> Enable
--    - Google Cloud Console: Create OAuth 2.0 Client ID (Web Application)
--    - Authorized Redirect URI: https://<your-project-ref>.supabase.co/auth/v1/callback
--    - Add Client ID and Client Secret in Supabase.
--
-- 2. PHONE OTP (SMS Provider):
--    - Supabase Dashboard -> Authentication -> Providers -> Phone -> Enable
--    - Select SMS Provider: Twilio (Account SID, Auth Token, Message Service SID)
--    - Set OTP expiry to 300 seconds. Supports +91 India numbers.
--
-- 3. RAZORPAY PAYMENT GATEWAY:
--    - Dashboard: https://dashboard.razorpay.com/
--    - Settings -> API Keys: Generate Key ID and Key Secret.
--    - Test Mode Key: rzp_test_... | Live Mode Key: rzp_live_...
--    - Configure VITE_RAZORPAY_KEY_ID in production environment variables.
-- =============================================================================

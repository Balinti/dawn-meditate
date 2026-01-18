-- Dawn Meditate Database Schema
-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  timezone TEXT,
  wake_window_start TIME,
  wake_window_end TIME
);

-- Create sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  device_id TEXT,
  started_at TIMESTAMPTZ NOT NULL,
  wake_time_reported TIMESTAMPTZ,
  context TEXT CHECK (context IN ('standard', 'low_light', 'gentle')),
  protocol_id TEXT,
  day_index INT,
  completed_at TIMESTAMPTZ,
  reaction_pre_score NUMERIC,
  reaction_post_score NUMERIC,
  energy_pre INT CHECK (energy_pre >= 1 AND energy_pre <= 5),
  energy_post INT CHECK (energy_post >= 1 AND energy_post <= 5),
  minutes_saved_est NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for sessions
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_device_id ON sessions(device_id);
CREATE INDEX IF NOT EXISTS idx_sessions_started_at ON sessions(started_at);

-- Create reaction_tests table
CREATE TABLE IF NOT EXISTS reaction_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  timing TEXT CHECK (timing IN ('pre', 'post')),
  raw_events JSONB,
  score NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(session_id, timing)
);

-- Create index for reaction_tests
CREATE INDEX IF NOT EXISTS idx_reaction_tests_session_id ON reaction_tests(session_id);

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  plan TEXT CHECK (plan IN ('free', 'plus', 'pro')) DEFAULT 'free',
  status TEXT,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for subscriptions
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer_id ON subscriptions(stripe_customer_id);

-- Create function to handle new user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id)
  VALUES (NEW.id);

  INSERT INTO public.subscriptions (user_id, plan)
  VALUES (NEW.id, 'free');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

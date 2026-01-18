# Dawn Meditate

A 10-minute "Morning Grogginess Fix" protocol (light + breath + micro-movement + hydration cue) with a 15-second reaction test to measure "time-to-alertness," usable instantly without signup and adaptive over 14 days.

## File Structure

```
dawn-meditate/
├── app/
│   ├── layout.tsx              # Root layout with Tailwind
│   ├── page.tsx                # Landing page
│   ├── globals.css             # Global styles
│   ├── not-found.tsx           # 404 page
│   ├── error.tsx               # Error boundary
│   ├── app/
│   │   └── page.tsx            # Core session flow
│   ├── dashboard/
│   │   └── page.tsx            # Progress dashboard
│   ├── login/
│   │   └── page.tsx            # Login page
│   ├── signup/
│   │   └── page.tsx            # Signup page
│   ├── account/
│   │   └── page.tsx            # Account settings
│   └── api/
│       ├── session/
│       │   ├── start/route.ts  # Start session
│       │   └── complete/route.ts # Complete session
│       ├── dashboard/route.ts  # Dashboard data
│       ├── entitlement/route.ts # User entitlement
│       └── stripe/
│           ├── checkout/route.ts # Create checkout
│           ├── portal/route.ts  # Billing portal
│           └── webhook/route.ts # Stripe webhooks
├── components/
│   ├── Navbar.tsx              # Navigation bar
│   ├── ReactionTest.tsx        # 15-second reaction test
│   ├── EnergyRating.tsx        # 1-5 energy rating
│   ├── ProtocolPlayer.tsx      # 10-minute protocol timer
│   ├── Paywall.tsx             # Day 4+ paywall
│   ├── SoftSignupPrompt.tsx    # Signup prompt
│   └── ChartMini.tsx           # Lightweight chart
├── lib/
│   ├── supabase/
│   │   ├── client.ts           # Browser client
│   │   └── server.ts           # Server client
│   ├── stripe.ts               # Stripe utilities
│   ├── protocols.ts            # Protocol definitions
│   ├── scoring.ts              # Reaction scoring
│   ├── storage.ts              # localStorage helpers
│   └── auth.ts                 # Auth helpers
├── supabase/
│   └── migrations/
│       ├── 0001_schema.sql     # Database schema
│       └── 0002_rls.sql        # RLS policies
├── public/
│   └── manifest.json           # PWA manifest
├── middleware.ts               # Auth middleware
└── README.md
```

## Database Schema

```sql
-- Profiles
CREATE TABLE profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  timezone TEXT,
  wake_window_start TIME,
  wake_window_end TIME
);

-- Sessions
CREATE TABLE sessions (
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
  energy_pre INT,
  energy_post INT,
  minutes_saved_est NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reaction Tests
CREATE TABLE reaction_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  timing TEXT CHECK (timing IN ('pre', 'post')),
  raw_events JSONB,
  score NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(session_id, timing)
);

-- Subscriptions
CREATE TABLE subscriptions (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  plan TEXT CHECK (plan IN ('free', 'plus', 'pro')) DEFAULT 'free',
  status TEXT,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## API Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/session/start` | POST | Start a new session, get protocol |
| `/api/session/complete` | POST | Complete session, save results |
| `/api/dashboard` | GET | Get user's session history |
| `/api/entitlement` | GET | Get user's subscription status |
| `/api/stripe/checkout` | POST | Create Stripe checkout session |
| `/api/stripe/portal` | POST | Create Stripe billing portal |
| `/api/stripe/webhook` | POST | Handle Stripe webhooks |

## UI Pages

| Route | Description |
|-------|-------------|
| `/` | Landing page with CTA |
| `/app` | Core session flow (anonymous OK) |
| `/dashboard` | Progress tracking |
| `/login` | Email/password login |
| `/signup` | Account creation |
| `/account` | Subscription management |

## Environment Variables

### Required (from Vercel shared)
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role (server only)
- `STRIPE_SECRET_KEY` - Stripe secret key (server only)
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Stripe public key
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook secret (optional)

### Project-specific
- `NEXT_PUBLIC_APP_URL` - App URL (https://dawn-meditate.vercel.app)
- `NEXT_PUBLIC_STRIPE_PLUS_PRICE_ID` - Stripe Plus plan price ID
- `NEXT_PUBLIC_STRIPE_PRO_PRICE_ID` - Stripe Pro plan price ID

## Deployment

1. Push to GitHub:
```bash
git init
gh repo create dawn-meditate --public --source=. --remote=origin
git add . && git commit -m "Initial build" && git push -u origin main
```

2. Deploy to Vercel:
```bash
npx vercel --yes
npx vercel --prod
```

3. Link environment variables via Vercel dashboard or CLI

4. Run Supabase migrations:
```bash
# In Supabase SQL editor, run:
# - supabase/migrations/0001_schema.sql
# - supabase/migrations/0002_rls.sql
```

## Features

- **Anonymous usage**: Full experience without signup for Days 1-3
- **Reaction testing**: 15-second tap test measuring alertness
- **Adaptive protocol**: Adjusts based on your progress
- **Progress tracking**: Charts and statistics
- **Subscription tiers**: Free (3 days), Plus, Pro
- **Data migration**: Local data syncs to account on signup

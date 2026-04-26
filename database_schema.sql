-- Budget planner cloud schema (Supabase / PostgreSQL)
-- Run in the Supabase SQL editor or via migrations.

-- Households: one row per shared budget space (e.g. apartment).
CREATE TABLE IF NOT EXISTS public.households (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Users: one row per Supabase Auth user, scoped to a household.
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  household_id UUID NOT NULL REFERENCES public.households (id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS users_household_id_idx ON public.users (household_id);

-- Expenses: strict isolation by household_id; user_id = who paid.
CREATE TABLE IF NOT EXISTS public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES public.households (id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  amount NUMERIC(14, 4) NOT NULL CHECK (amount >= 0),
  category TEXT NOT NULL,
  date DATE NOT NULL,
  note TEXT NOT NULL DEFAULT '',
  is_joint BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX IF NOT EXISTS expenses_household_id_date_idx
  ON public.expenses (household_id, date DESC);

CREATE INDEX IF NOT EXISTS expenses_user_id_idx ON public.expenses (user_id);

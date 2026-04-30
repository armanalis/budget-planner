-- Budget planner cloud schema (Supabase / PostgreSQL)
-- Run in the Supabase SQL editor or via migrations.
--
-- This file is idempotent: every run drops/recreates policies and functions
-- but never drops user data. Run it whenever you change the schema.
--
-- This revision introduces multi-household support:
--   - `users.household_id` was renamed to `users.active_household_id`.
--   - `household_members` is the new many-to-many mapping between users and
--     households. Membership lives there; `users.active_household_id` only
--     remembers which household the user is currently looking at.

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

-- Households: one row per shared budget space.
CREATE TABLE IF NOT EXISTS public.households (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Normalize names and enforce uniqueness globally so "Home", " home ",
-- and "HOME" all point to exactly one household.
UPDATE public.households
SET name = trim(name)
WHERE name IS DISTINCT FROM trim(name);

UPDATE public.households
SET name = 'Household ' || substr(id::text, 1, 8)
WHERE trim(name) = '';

WITH ranked AS (
  SELECT
    id,
    name,
    row_number() OVER (
      PARTITION BY lower(trim(name))
      ORDER BY created_at ASC, id ASC
    ) AS rn
  FROM public.households
)
UPDATE public.households h
SET name = ranked.name || ' (' || ranked.rn || ')'
FROM ranked
WHERE h.id = ranked.id
  AND ranked.rn > 1;

CREATE UNIQUE INDEX IF NOT EXISTS households_name_unique_idx
  ON public.households (lower(trim(name)));

-- Track who created each household so we know who can approve join requests.
ALTER TABLE public.households
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users (id);

-- Users: one row per Supabase Auth user. `active_household_id` is the
-- household they are currently looking at; their full membership list lives
-- in `household_members`.
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  active_household_id UUID REFERENCES public.households (id) ON DELETE SET NULL,
  display_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Backfill for projects that existed before the rename: if the column is
-- still called `household_id`, rename it. Idempotent.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'household_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'active_household_id'
  ) THEN
    ALTER TABLE public.users RENAME COLUMN household_id TO active_household_id;
  END IF;
END $$;

-- The new column should be nullable: a user without any membership has no
-- active household yet. Drop the old NOT NULL if present.
ALTER TABLE public.users ALTER COLUMN active_household_id DROP NOT NULL;

CREATE INDEX IF NOT EXISTS users_active_household_id_idx
  ON public.users (active_household_id);

-- Membership: many-to-many between users and households.
CREATE TABLE IF NOT EXISTS public.household_members (
  user_id UUID NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  household_id UUID NOT NULL REFERENCES public.households (id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, household_id)
);

CREATE INDEX IF NOT EXISTS household_members_household_idx
  ON public.household_members (household_id);

-- Backfill `households.created_by` for older households using earliest member.
UPDATE public.households h
SET created_by = sub.id
FROM (
  SELECT DISTINCT ON (u.active_household_id)
    u.active_household_id, u.id, u.created_at
  FROM public.users u
  WHERE u.active_household_id IS NOT NULL
  ORDER BY u.active_household_id, u.created_at ASC
) sub
WHERE h.created_by IS NULL
  AND h.id = sub.active_household_id;

-- Backfill `household_members` so existing users keep access after the rename.
INSERT INTO public.household_members (user_id, household_id)
SELECT id, active_household_id
FROM public.users
WHERE active_household_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- Expenses: strict isolation by household_id; user_id = who paid.
CREATE TABLE IF NOT EXISTS public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES public.households (id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  amount NUMERIC(14, 4) NOT NULL CHECK (amount >= 0),
  main_category TEXT NOT NULL DEFAULT 'Other',
  sub_category TEXT,
  category TEXT NOT NULL,
  date DATE NOT NULL,
  note TEXT NOT NULL DEFAULT '',
  is_joint BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX IF NOT EXISTS expenses_household_id_date_idx
  ON public.expenses (household_id, date DESC);
CREATE INDEX IF NOT EXISTS expenses_user_id_idx ON public.expenses (user_id);

-- Notifications: simple in-app inbox keyed to a Supabase Auth user.
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS notifications_recipient_idx
  ON public.notifications (recipient_id, created_at DESC);

-- Messages: household-wide chat. One row per chat message.
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES public.households (id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (
    char_length(content) > 0 AND char_length(content) <= 2000
  ),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS messages_household_created_idx
  ON public.messages (household_id, created_at);

-- Recurring expenses: per-household template inserted every month.
CREATE TABLE IF NOT EXISTS public.recurring_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES public.households (id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  amount NUMERIC(14, 4) NOT NULL CHECK (amount >= 0),
  main_category TEXT NOT NULL DEFAULT 'Other',
  sub_category TEXT,
  category TEXT NOT NULL,
  note TEXT,
  is_joint BOOLEAN NOT NULL DEFAULT false,
  next_process_month TEXT NOT NULL CHECK (next_process_month ~ '^[0-9]{4}-[0-9]{2}$')
);

CREATE INDEX IF NOT EXISTS recurring_expenses_household_id_idx
  ON public.recurring_expenses (household_id);

-- Budgets: per-household monthly limit per category.
CREATE TABLE IF NOT EXISTS public.budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES public.households (id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  limit_amount NUMERIC(14, 4) NOT NULL CHECK (limit_amount >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (household_id, category)
);

CREATE INDEX IF NOT EXISTS budgets_household_id_idx
  ON public.budgets (household_id);

-- Sub-category limits grouped under a main category.
CREATE TABLE IF NOT EXISTS public.subcategory_budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES public.households (id) ON DELETE CASCADE,
  main_category TEXT NOT NULL,
  sub_category TEXT NOT NULL,
  limit_amount NUMERIC(14, 4) NOT NULL CHECK (limit_amount >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (household_id, main_category, sub_category)
);

CREATE INDEX IF NOT EXISTS subcategory_budgets_household_main_idx
  ON public.subcategory_budgets (household_id, main_category);

-- Ensure new columns exist for older environments.
ALTER TABLE public.expenses
  ADD COLUMN IF NOT EXISTS main_category TEXT;
ALTER TABLE public.expenses
  ADD COLUMN IF NOT EXISTS sub_category TEXT;
UPDATE public.expenses
SET main_category = COALESCE(NULLIF(trim(main_category), ''), category, 'Other')
WHERE main_category IS NULL OR trim(main_category) = '';
ALTER TABLE public.expenses
  ALTER COLUMN main_category SET DEFAULT 'Other';
ALTER TABLE public.expenses
  ALTER COLUMN main_category SET NOT NULL;

ALTER TABLE public.recurring_expenses
  ADD COLUMN IF NOT EXISTS main_category TEXT;
ALTER TABLE public.recurring_expenses
  ADD COLUMN IF NOT EXISTS sub_category TEXT;
UPDATE public.recurring_expenses
SET main_category = COALESCE(NULLIF(trim(main_category), ''), category, 'Other')
WHERE main_category IS NULL OR trim(main_category) = '';
ALTER TABLE public.recurring_expenses
  ALTER COLUMN main_category SET DEFAULT 'Other';
ALTER TABLE public.recurring_expenses
  ALTER COLUMN main_category SET NOT NULL;

-- Household join requests: a sign-up that targets an existing household name.
CREATE TABLE IF NOT EXISTS public.household_join_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES public.households (id) ON DELETE CASCADE,
  requester_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  requester_display_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  decided_at TIMESTAMPTZ,
  decided_by UUID REFERENCES auth.users (id)
);

-- A user can only have one pending request per household at a time.
CREATE UNIQUE INDEX IF NOT EXISTS household_join_requests_unique_pending
  ON public.household_join_requests (household_id, requester_id)
  WHERE status = 'pending';

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

ALTER TABLE public.households ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.household_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.household_join_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recurring_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subcategory_budgets ENABLE ROW LEVEL SECURITY;

-- Helper that returns the household id the current user is actively viewing.
-- SECURITY DEFINER so it can read public.users without recursing through
-- that table's own RLS policies.
CREATE OR REPLACE FUNCTION public.current_household_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT active_household_id
  FROM public.users
  WHERE id = auth.uid()
  LIMIT 1
$$;

REVOKE ALL ON FUNCTION public.current_household_id() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_household_id() TO authenticated;

-- Returns all household ids for the current user (across memberships).
CREATE OR REPLACE FUNCTION public.current_user_household_ids()
RETURNS SETOF UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT household_id
  FROM public.household_members
  WHERE user_id = auth.uid()
$$;

REVOKE ALL ON FUNCTION public.current_user_household_ids() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_user_household_ids() TO authenticated;

-- Helper used by policies to avoid recursive references.
CREATE OR REPLACE FUNCTION public.owner_household_ids()
RETURNS SETOF UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id
  FROM public.households
  WHERE created_by = auth.uid()
$$;

REVOKE ALL ON FUNCTION public.owner_household_ids() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.owner_household_ids() TO authenticated;

-- Pending-request households for current user (used by policy).
CREATE OR REPLACE FUNCTION public.pending_request_household_ids()
RETURNS SETOF UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT household_id
  FROM public.household_join_requests
  WHERE requester_id = auth.uid()
$$;

REVOKE ALL ON FUNCTION public.pending_request_household_ids() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.pending_request_household_ids() TO authenticated;

-- Returns every household the current user belongs to.
CREATE OR REPLACE FUNCTION public.get_my_households()
RETURNS TABLE (
  id UUID,
  name TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT h.id, h.name, h.created_by, h.created_at
  FROM public.households h
  JOIN public.household_members hm ON hm.household_id = h.id
  WHERE hm.user_id = auth.uid()
  ORDER BY h.name ASC
$$;

REVOKE ALL ON FUNCTION public.get_my_households() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_my_households() TO authenticated;

-- Resolve a household by name for onboarding join flow.
-- SECURITY DEFINER avoids policy recursion risks on households SELECT.
CREATE OR REPLACE FUNCTION public.find_household_by_name(p_name TEXT)
RETURNS TABLE (
  id UUID,
  name TEXT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT h.id, h.name
  FROM public.households h
  WHERE lower(trim(h.name)) = lower(trim(COALESCE(p_name, '')))
  ORDER BY h.created_at ASC
  LIMIT 2
$$;

REVOKE ALL ON FUNCTION public.find_household_by_name(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.find_household_by_name(TEXT) TO authenticated;

-- Returns the household record the user is currently viewing.
CREATE OR REPLACE FUNCTION public.get_my_household()
RETURNS TABLE (
  id UUID,
  name TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT h.id, h.name, h.created_by, h.created_at
  FROM public.households h
  JOIN public.users u ON u.active_household_id = h.id
  WHERE u.id = auth.uid()
  LIMIT 1
$$;

REVOKE ALL ON FUNCTION public.get_my_household() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_my_household() TO authenticated;

-- Returns the user_ids that share a household with the current user.
CREATE OR REPLACE FUNCTION public.same_household_user_ids()
RETURNS SETOF UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT hm2.user_id
  FROM public.household_members hm1
  JOIN public.household_members hm2 ON hm1.household_id = hm2.household_id
  WHERE hm1.user_id = auth.uid()
$$;

REVOKE ALL ON FUNCTION public.same_household_user_ids() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.same_household_user_ids() TO authenticated;

-- Switch the current user's active household. Verifies membership first.
CREATE OR REPLACE FUNCTION public.switch_active_household(p_household_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.household_members
    WHERE user_id = auth.uid() AND household_id = p_household_id
  ) THEN
    RAISE EXCEPTION 'Not a member of this household';
  END IF;

  UPDATE public.users
  SET active_household_id = p_household_id
  WHERE id = auth.uid();
END;
$$;

REVOKE ALL ON FUNCTION public.switch_active_household(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.switch_active_household(UUID) TO authenticated;

CREATE OR REPLACE FUNCTION public.assert_subcategory_allocations(
  p_household_id UUID,
  p_main_category TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_main_limit NUMERIC(14, 4);
  v_sub_sum NUMERIC(14, 4);
BEGIN
  SELECT b.limit_amount
  INTO v_main_limit
  FROM public.budgets b
  WHERE b.household_id = p_household_id
    AND b.category = p_main_category
  LIMIT 1;

  SELECT COALESCE(SUM(sb.limit_amount), 0)
  INTO v_sub_sum
  FROM public.subcategory_budgets sb
  WHERE sb.household_id = p_household_id
    AND sb.main_category = p_main_category;

  IF v_main_limit IS NOT NULL AND v_sub_sum > v_main_limit THEN
    RAISE EXCEPTION 'Sub-category limits exceed main category limit (% > % for %)',
      v_sub_sum, v_main_limit, p_main_category;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.assert_subcategory_allocations(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.assert_subcategory_allocations(UUID, TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION public.validate_subcategory_budget_total()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_main_limit NUMERIC(14, 4);
  v_sub_sum NUMERIC(14, 4);
BEGIN
  SELECT b.limit_amount
  INTO v_main_limit
  FROM public.budgets b
  WHERE b.household_id = NEW.household_id
    AND b.category = NEW.main_category
  LIMIT 1;

  SELECT COALESCE(SUM(sb.limit_amount), 0)
  INTO v_sub_sum
  FROM public.subcategory_budgets sb
  WHERE sb.household_id = NEW.household_id
    AND sb.main_category = NEW.main_category
    AND (TG_OP <> 'UPDATE' OR sb.id <> NEW.id);

  v_sub_sum := v_sub_sum + NEW.limit_amount;
  IF v_main_limit IS NOT NULL AND v_sub_sum > v_main_limit THEN
    RAISE EXCEPTION 'Sub-category limits exceed main category limit (% > % for %)',
      v_sub_sum, v_main_limit, NEW.main_category;
  END IF;

  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_subcategory_budget_total ON public.subcategory_budgets;
CREATE TRIGGER trg_subcategory_budget_total
  BEFORE INSERT OR UPDATE ON public.subcategory_budgets
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_subcategory_budget_total();

CREATE OR REPLACE FUNCTION public.validate_main_budget_total()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sub_sum NUMERIC(14, 4);
BEGIN
  NEW.updated_at := now();
  SELECT COALESCE(SUM(sb.limit_amount), 0)
  INTO v_sub_sum
  FROM public.subcategory_budgets sb
  WHERE sb.household_id = NEW.household_id
    AND sb.main_category = NEW.category;

  IF v_sub_sum > NEW.limit_amount THEN
    RAISE EXCEPTION 'Main category limit is smaller than current sub-category allocation (% > % for %)',
      v_sub_sum, NEW.limit_amount, NEW.category;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_main_budget_total ON public.budgets;
CREATE TRIGGER trg_main_budget_total
  BEFORE INSERT OR UPDATE ON public.budgets
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_main_budget_total();

CREATE OR REPLACE FUNCTION public.validate_expense_budget_limits()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_main_limit NUMERIC(14, 4);
  v_sub_limit NUMERIC(14, 4);
  v_month_main_spent NUMERIC(14, 4);
  v_month_sub_spent NUMERIC(14, 4);
  v_main TEXT;
  v_sub TEXT;
BEGIN
  v_main := trim(COALESCE(NEW.main_category, ''));
  v_sub := NULLIF(trim(COALESCE(NEW.sub_category, '')), '');

  IF v_main = '' THEN
    RAISE EXCEPTION 'Main category is required';
  END IF;

  NEW.main_category := v_main;
  NEW.sub_category := v_sub;
  NEW.category := COALESCE(v_sub, v_main);

  SELECT b.limit_amount
  INTO v_main_limit
  FROM public.budgets b
  WHERE b.household_id = NEW.household_id
    AND b.category = v_main
  LIMIT 1;

  IF v_main_limit IS NOT NULL THEN
    SELECT COALESCE(SUM(e.amount), 0)
    INTO v_month_main_spent
    FROM public.expenses e
    WHERE e.household_id = NEW.household_id
      AND e.main_category = v_main
      AND to_char(e.date, 'YYYY-MM') = to_char(NEW.date, 'YYYY-MM')
      AND (TG_OP <> 'UPDATE' OR e.id <> NEW.id);

    IF v_month_main_spent + NEW.amount > v_main_limit THEN
      RAISE EXCEPTION 'Main category limit exceeded for %', v_main;
    END IF;
  END IF;

  IF v_sub IS NOT NULL THEN
    SELECT sb.limit_amount
    INTO v_sub_limit
    FROM public.subcategory_budgets sb
    WHERE sb.household_id = NEW.household_id
      AND sb.main_category = v_main
      AND sb.sub_category = v_sub
    LIMIT 1;

    IF v_sub_limit IS NOT NULL THEN
      SELECT COALESCE(SUM(e.amount), 0)
      INTO v_month_sub_spent
      FROM public.expenses e
      WHERE e.household_id = NEW.household_id
        AND e.main_category = v_main
        AND e.sub_category = v_sub
        AND to_char(e.date, 'YYYY-MM') = to_char(NEW.date, 'YYYY-MM')
        AND (TG_OP <> 'UPDATE' OR e.id <> NEW.id);

      IF v_month_sub_spent + NEW.amount > v_sub_limit THEN
        RAISE EXCEPTION 'Sub-category limit exceeded for %/%', v_main, v_sub;
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_expenses_budget_limits ON public.expenses;
CREATE TRIGGER trg_expenses_budget_limits
  BEFORE INSERT OR UPDATE ON public.expenses
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_expense_budget_limits();

CREATE OR REPLACE FUNCTION public.upsert_subcategory_budget(
  p_main_category TEXT,
  p_sub_category TEXT,
  p_limit_amount NUMERIC
)
RETURNS TABLE (
  id UUID,
  household_id UUID,
  main_category TEXT,
  sub_category TEXT,
  limit_amount NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_household_id UUID;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  v_household_id := public.current_household_id();
  IF v_household_id IS NULL THEN
    RAISE EXCEPTION 'No active household';
  END IF;
  IF p_limit_amount IS NULL OR p_limit_amount < 0 THEN
    RAISE EXCEPTION 'Sub-category limit must be a non-negative number';
  END IF;
  IF trim(COALESCE(p_main_category, '')) = '' OR trim(COALESCE(p_sub_category, '')) = '' THEN
    RAISE EXCEPTION 'Main and sub-category names are required';
  END IF;

  INSERT INTO public.subcategory_budgets (
    household_id, main_category, sub_category, limit_amount
  ) VALUES (
    v_household_id, trim(p_main_category), trim(p_sub_category), p_limit_amount
  )
  ON CONFLICT (household_id, main_category, sub_category)
  DO UPDATE
  SET limit_amount = EXCLUDED.limit_amount,
      updated_at = now();

  RETURN QUERY
  SELECT sb.id, sb.household_id, sb.main_category, sb.sub_category, sb.limit_amount
  FROM public.subcategory_budgets sb
  WHERE sb.household_id = v_household_id
    AND sb.main_category = trim(p_main_category)
    AND sb.sub_category = trim(p_sub_category)
  LIMIT 1;
END;
$$;

REVOKE ALL ON FUNCTION public.upsert_subcategory_budget(TEXT, TEXT, NUMERIC) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.upsert_subcategory_budget(TEXT, TEXT, NUMERIC) TO authenticated;

CREATE OR REPLACE FUNCTION public.delete_subcategory_budget(
  p_main_category TEXT,
  p_sub_category TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_household_id UUID;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  v_household_id := public.current_household_id();
  IF v_household_id IS NULL THEN
    RAISE EXCEPTION 'No active household';
  END IF;

  DELETE FROM public.subcategory_budgets
  WHERE household_id = v_household_id
    AND main_category = trim(COALESCE(p_main_category, ''))
    AND sub_category = trim(COALESCE(p_sub_category, ''));
END;
$$;

REVOKE ALL ON FUNCTION public.delete_subcategory_budget(TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delete_subcategory_budget(TEXT, TEXT) TO authenticated;

-- Create a new household, add the current user as member, and switch active.
CREATE OR REPLACE FUNCTION public.create_household_and_join(p_name TEXT)
RETURNS TABLE (
  id UUID,
  name TEXT,
  created_by UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_name TEXT;
  v_id UUID;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  v_name := trim(COALESCE(p_name, ''));
  IF char_length(v_name) = 0 THEN
    RAISE EXCEPTION 'Household name cannot be empty';
  END IF;
  IF char_length(v_name) > 100 THEN
    RAISE EXCEPTION 'Household name too long';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.households
    WHERE lower(trim(name)) = lower(trim(v_name))
  ) THEN
    RAISE EXCEPTION 'Another household already uses that name';
  END IF;

  INSERT INTO public.households (name, created_by)
  VALUES (v_name, auth.uid())
  RETURNING households.id INTO v_id;

  INSERT INTO public.household_members (user_id, household_id)
  VALUES (auth.uid(), v_id)
  ON CONFLICT DO NOTHING;

  UPDATE public.users
  SET active_household_id = v_id
  WHERE id = auth.uid();

  RETURN QUERY
  SELECT h.id, h.name, h.created_by
  FROM public.households h
  WHERE h.id = v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.create_household_and_join(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_household_and_join(TEXT) TO authenticated;

-- USERS ---------------------------------------------------------------------
DROP POLICY IF EXISTS users_select_own ON public.users;
CREATE POLICY users_select_own
ON public.users FOR SELECT TO authenticated
USING (id = auth.uid());

DROP POLICY IF EXISTS users_select_same_household ON public.users;
CREATE POLICY users_select_same_household
ON public.users FOR SELECT TO authenticated
USING (id IN (SELECT public.same_household_user_ids()));

DROP POLICY IF EXISTS users_insert_self ON public.users;
CREATE POLICY users_insert_self
ON public.users FOR INSERT TO authenticated
WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS users_update_self ON public.users;
CREATE POLICY users_update_self
ON public.users FOR UPDATE TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- HOUSEHOLDS ----------------------------------------------------------------
DROP POLICY IF EXISTS households_insert_authenticated ON public.households;
CREATE POLICY households_insert_authenticated
ON public.households FOR INSERT TO authenticated
WITH CHECK (true);

-- A user can read every household they belong to (not just the active one).
DROP POLICY IF EXISTS households_select_own ON public.households;
CREATE POLICY households_select_own
ON public.households FOR SELECT TO authenticated
USING (
  id IN (SELECT public.current_user_household_ids())
);

-- Pending requesters need to read the household they applied to so the app
-- can show "Your request to join 'X' is pending".
DROP POLICY IF EXISTS households_select_for_requester ON public.households;
CREATE POLICY households_select_for_requester
ON public.households FOR SELECT TO authenticated
USING (
  id IN (SELECT public.pending_request_household_ids())
);

-- HOUSEHOLD_MEMBERS ---------------------------------------------------------
DROP POLICY IF EXISTS hm_select_self ON public.household_members;
CREATE POLICY hm_select_self
ON public.household_members FOR SELECT TO authenticated
USING (household_id IN (SELECT public.current_user_household_ids()));

DROP POLICY IF EXISTS hm_insert_self ON public.household_members;
CREATE POLICY hm_insert_self
ON public.household_members FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS hm_delete_self ON public.household_members;
CREATE POLICY hm_delete_self
ON public.household_members FOR DELETE TO authenticated
USING (user_id = auth.uid());

-- EXPENSES ------------------------------------------------------------------
DROP POLICY IF EXISTS expenses_select_same_household ON public.expenses;
CREATE POLICY expenses_select_same_household
ON public.expenses FOR SELECT TO authenticated
USING (household_id = public.current_household_id());

DROP POLICY IF EXISTS expenses_insert_same_household ON public.expenses;
CREATE POLICY expenses_insert_same_household
ON public.expenses FOR INSERT TO authenticated
WITH CHECK (household_id = public.current_household_id());

DROP POLICY IF EXISTS expenses_delete_same_household ON public.expenses;
CREATE POLICY expenses_delete_same_household
ON public.expenses FOR DELETE TO authenticated
USING (household_id = public.current_household_id());

-- NOTIFICATIONS -------------------------------------------------------------
DROP POLICY IF EXISTS notifications_select_own ON public.notifications;
CREATE POLICY notifications_select_own
ON public.notifications FOR SELECT TO authenticated
USING (recipient_id = auth.uid());

DROP POLICY IF EXISTS notifications_update_own ON public.notifications;
CREATE POLICY notifications_update_own
ON public.notifications FOR UPDATE TO authenticated
USING (recipient_id = auth.uid())
WITH CHECK (recipient_id = auth.uid());

DROP POLICY IF EXISTS notifications_delete_own ON public.notifications;
CREATE POLICY notifications_delete_own
ON public.notifications FOR DELETE TO authenticated
USING (recipient_id = auth.uid());

-- JOIN REQUESTS -------------------------------------------------------------
DROP POLICY IF EXISTS join_requests_select_requester ON public.household_join_requests;
CREATE POLICY join_requests_select_requester
ON public.household_join_requests FOR SELECT TO authenticated
USING (requester_id = auth.uid());

DROP POLICY IF EXISTS join_requests_select_owner ON public.household_join_requests;
CREATE POLICY join_requests_select_owner
ON public.household_join_requests FOR SELECT TO authenticated
USING (
  household_id IN (SELECT public.owner_household_ids())
);

-- MESSAGES ------------------------------------------------------------------
DROP POLICY IF EXISTS messages_select_same_household ON public.messages;
CREATE POLICY messages_select_same_household
ON public.messages FOR SELECT TO authenticated
USING (household_id = public.current_household_id());

DROP POLICY IF EXISTS messages_insert_self ON public.messages;
CREATE POLICY messages_insert_self
ON public.messages FOR INSERT TO authenticated
WITH CHECK (
  sender_id = auth.uid()
  AND household_id = public.current_household_id()
);

DROP POLICY IF EXISTS messages_delete_own ON public.messages;
CREATE POLICY messages_delete_own
ON public.messages FOR DELETE TO authenticated
USING (sender_id = auth.uid());

-- BUDGETS -------------------------------------------------------------------
DROP POLICY IF EXISTS budgets_select_same_household ON public.budgets;
CREATE POLICY budgets_select_same_household
ON public.budgets FOR SELECT TO authenticated
USING (household_id = public.current_household_id());

DROP POLICY IF EXISTS budgets_insert_same_household ON public.budgets;
CREATE POLICY budgets_insert_same_household
ON public.budgets FOR INSERT TO authenticated
WITH CHECK (household_id = public.current_household_id());

DROP POLICY IF EXISTS budgets_update_same_household ON public.budgets;
CREATE POLICY budgets_update_same_household
ON public.budgets FOR UPDATE TO authenticated
USING (household_id = public.current_household_id())
WITH CHECK (household_id = public.current_household_id());

DROP POLICY IF EXISTS budgets_delete_same_household ON public.budgets;
CREATE POLICY budgets_delete_same_household
ON public.budgets FOR DELETE TO authenticated
USING (household_id = public.current_household_id());

-- SUBCATEGORY_BUDGETS --------------------------------------------------------
DROP POLICY IF EXISTS subcategory_budgets_select_same_household ON public.subcategory_budgets;
CREATE POLICY subcategory_budgets_select_same_household
ON public.subcategory_budgets FOR SELECT TO authenticated
USING (household_id = public.current_household_id());

DROP POLICY IF EXISTS subcategory_budgets_insert_same_household ON public.subcategory_budgets;
CREATE POLICY subcategory_budgets_insert_same_household
ON public.subcategory_budgets FOR INSERT TO authenticated
WITH CHECK (household_id = public.current_household_id());

DROP POLICY IF EXISTS subcategory_budgets_update_same_household ON public.subcategory_budgets;
CREATE POLICY subcategory_budgets_update_same_household
ON public.subcategory_budgets FOR UPDATE TO authenticated
USING (household_id = public.current_household_id())
WITH CHECK (household_id = public.current_household_id());

DROP POLICY IF EXISTS subcategory_budgets_delete_same_household ON public.subcategory_budgets;
CREATE POLICY subcategory_budgets_delete_same_household
ON public.subcategory_budgets FOR DELETE TO authenticated
USING (household_id = public.current_household_id());

-- RECURRING EXPENSES --------------------------------------------------------
DROP POLICY IF EXISTS recurring_select_same_household ON public.recurring_expenses;
CREATE POLICY recurring_select_same_household
ON public.recurring_expenses FOR SELECT TO authenticated
USING (household_id = public.current_household_id());

DROP POLICY IF EXISTS recurring_insert_same_household ON public.recurring_expenses;
CREATE POLICY recurring_insert_same_household
ON public.recurring_expenses FOR INSERT TO authenticated
WITH CHECK (household_id = public.current_household_id());

DROP POLICY IF EXISTS recurring_update_same_household ON public.recurring_expenses;
CREATE POLICY recurring_update_same_household
ON public.recurring_expenses FOR UPDATE TO authenticated
USING (household_id = public.current_household_id())
WITH CHECK (household_id = public.current_household_id());

DROP POLICY IF EXISTS recurring_delete_same_household ON public.recurring_expenses;
CREATE POLICY recurring_delete_same_household
ON public.recurring_expenses FOR DELETE TO authenticated
USING (household_id = public.current_household_id());

-- Add messages to the realtime publication so the client can subscribe.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename  = 'messages'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.messages';
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- Sign-up trigger: provisions the new user's profile and household.
-- - If `household_name` matches an existing household (case-insensitive):
--   create a pending join request and notify that household's owner.
-- - Otherwise: create a brand-new household, the user's profile, and the
--   matching household_members row.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_display_name TEXT;
  v_household_name TEXT;
  v_existing_household_id UUID;
  v_existing_household_name TEXT;
  v_existing_owner_id UUID;
  v_new_household_id UUID;
BEGIN
  v_display_name := COALESCE(
    NULLIF(trim(NEW.raw_user_meta_data->>'display_name'), ''),
    split_part(COALESCE(NEW.email, ''), '@', 1),
    'Member'
  );
  v_household_name := NULLIF(trim(NEW.raw_user_meta_data->>'household_name'), '');

  IF v_household_name IS NOT NULL THEN
    SELECT id, name, created_by
    INTO v_existing_household_id, v_existing_household_name, v_existing_owner_id
    FROM public.households
    WHERE lower(trim(name)) = lower(trim(v_household_name))
    ORDER BY created_at ASC
    LIMIT 1;

    IF v_existing_household_id IS NOT NULL THEN
      INSERT INTO public.household_join_requests (
        household_id, requester_id, requester_display_name, status
      ) VALUES (
        v_existing_household_id, NEW.id, v_display_name, 'pending'
      );

      IF v_existing_owner_id IS NOT NULL THEN
        INSERT INTO public.notifications (recipient_id, type, data)
        VALUES (
          v_existing_owner_id,
          'join_request_received',
          jsonb_build_object(
            'household_id', v_existing_household_id,
            'household_name', v_existing_household_name,
            'requester_id', NEW.id,
            'requester_display_name', v_display_name,
            'requester_email', COALESCE(NEW.email, '')
          )
        );
      END IF;

      RETURN NEW;
    END IF;
  END IF;

  INSERT INTO public.households (name, created_by)
  VALUES (
    COALESCE(v_household_name, v_display_name || '''s household'),
    NEW.id
  )
  RETURNING id INTO v_new_household_id;

  INSERT INTO public.users (id, active_household_id, display_name)
  VALUES (NEW.id, v_new_household_id, v_display_name);

  INSERT INTO public.household_members (user_id, household_id)
  VALUES (NEW.id, v_new_household_id)
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Approval / rejection RPCs (called from the notifications page).
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.approve_join_request(p_request_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_req public.household_join_requests%ROWTYPE;
  v_hh public.households%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO v_req FROM public.household_join_requests WHERE id = p_request_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Request not found'; END IF;
  IF v_req.status <> 'pending' THEN RAISE EXCEPTION 'Request already decided'; END IF;

  SELECT * INTO v_hh FROM public.households WHERE id = v_req.household_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Household not found'; END IF;
  IF v_hh.created_by IS NULL OR v_hh.created_by <> auth.uid() THEN
    RAISE EXCEPTION 'Only the household owner can approve';
  END IF;

  -- Ensure the requester has a profile row. Set the active household to the
  -- newly approved one if they don't already have one chosen.
  INSERT INTO public.users (id, active_household_id, display_name)
  VALUES (v_req.requester_id, v_req.household_id, v_req.requester_display_name)
  ON CONFLICT (id) DO UPDATE
    SET active_household_id = COALESCE(public.users.active_household_id, EXCLUDED.active_household_id),
        display_name = EXCLUDED.display_name;

  -- Add them to the household's member list.
  INSERT INTO public.household_members (user_id, household_id)
  VALUES (v_req.requester_id, v_req.household_id)
  ON CONFLICT DO NOTHING;

  UPDATE public.household_join_requests
  SET status = 'approved', decided_at = now(), decided_by = auth.uid()
  WHERE id = p_request_id;

  INSERT INTO public.notifications (recipient_id, type, data)
  VALUES (
    v_req.requester_id,
    'join_request_approved',
    jsonb_build_object(
      'household_id', v_req.household_id,
      'household_name', v_hh.name
    )
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.approve_join_request(UUID) TO authenticated;

CREATE OR REPLACE FUNCTION public.reject_join_request(p_request_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_req public.household_join_requests%ROWTYPE;
  v_hh public.households%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO v_req FROM public.household_join_requests WHERE id = p_request_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Request not found'; END IF;
  IF v_req.status <> 'pending' THEN RAISE EXCEPTION 'Request already decided'; END IF;

  SELECT * INTO v_hh FROM public.households WHERE id = v_req.household_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Household not found'; END IF;
  IF v_hh.created_by IS NULL OR v_hh.created_by <> auth.uid() THEN
    RAISE EXCEPTION 'Only the household owner can reject';
  END IF;

  UPDATE public.household_join_requests
  SET status = 'rejected', decided_at = now(), decided_by = auth.uid()
  WHERE id = p_request_id;

  INSERT INTO public.notifications (recipient_id, type, data)
  VALUES (
    v_req.requester_id,
    'join_request_rejected',
    jsonb_build_object(
      'household_id', v_req.household_id,
      'household_name', v_hh.name
    )
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.reject_join_request(UUID) TO authenticated;

-- ---------------------------------------------------------------------------
-- Owner-only RPC: rename the user's currently active household.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.rename_household(p_name TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_household_id UUID;
  v_clean_name   TEXT;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  v_clean_name := trim(COALESCE(p_name, ''));
  IF char_length(v_clean_name) = 0 THEN
    RAISE EXCEPTION 'Household name cannot be empty';
  END IF;
  IF char_length(v_clean_name) > 100 THEN
    RAISE EXCEPTION 'Household name too long';
  END IF;

  SELECT u.active_household_id INTO v_household_id
  FROM public.users u
  WHERE u.id = auth.uid();

  IF v_household_id IS NULL THEN
    RAISE EXCEPTION 'No active household for this user';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.households
    WHERE id = v_household_id AND created_by = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Only the household owner can rename it';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.households
    WHERE id <> v_household_id
      AND lower(trim(name)) = lower(trim(v_clean_name))
  ) THEN
    RAISE EXCEPTION 'Another household already uses that name';
  END IF;

  UPDATE public.households
  SET name = v_clean_name
  WHERE id = v_household_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.rename_household(TEXT) TO authenticated;

-- ---------------------------------------------------------------------------
-- Owner-only RPC: delete the user's currently active household.
-- If this household is active for any users, move them to one of their other
-- memberships when possible; otherwise set active_household_id to NULL.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.delete_active_household()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_household_id UUID;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT u.active_household_id INTO v_household_id
  FROM public.users u
  WHERE u.id = auth.uid();

  IF v_household_id IS NULL THEN
    RAISE EXCEPTION 'No active household for this user';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.households
    WHERE id = v_household_id AND created_by = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Only the household owner can delete it';
  END IF;

  -- For users currently on this household, pick another membership if any.
  UPDATE public.users u
  SET active_household_id = alt.next_household_id
  FROM (
    SELECT
      u2.id AS user_id,
      (
        SELECT hm.household_id
        FROM public.household_members hm
        WHERE hm.user_id = u2.id
          AND hm.household_id <> v_household_id
        ORDER BY hm.joined_at ASC
        LIMIT 1
      ) AS next_household_id
    FROM public.users u2
    WHERE u2.active_household_id = v_household_id
  ) alt
  WHERE u.id = alt.user_id;

  DELETE FROM public.households
  WHERE id = v_household_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.delete_active_household() TO authenticated;

-- ---------------------------------------------------------------------------
-- Helpful one-off backfills (safe to re-run).
-- ---------------------------------------------------------------------------

-- 1) Fill blank display_names from auth.users metadata or email prefix.
UPDATE public.users u
SET display_name = COALESCE(
  NULLIF(trim((au.raw_user_meta_data->>'display_name')::text), ''),
  split_part(COALESCE(au.email, ''), '@', 1),
  'Member'
)
FROM auth.users au
WHERE u.id = au.id
  AND (u.display_name IS NULL OR trim(u.display_name) = '' OR u.display_name = 'Member');

-- 2) Auto-provision a household + profile for any auth user that doesn't
--    have a public.users row yet (e.g. accounts created before the trigger
--    existed). Mirrors handle_new_user() for the "no household name" path.
INSERT INTO public.households (name, created_by)
SELECT
  COALESCE(
    NULLIF(trim((au.raw_user_meta_data->>'household_name')::text), ''),
    split_part(COALESCE(au.email, ''), '@', 1) || '''s household'
  ) AS name,
  au.id
FROM auth.users au
LEFT JOIN public.users u ON u.id = au.id
WHERE u.id IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.household_join_requests r
    WHERE r.requester_id = au.id AND r.status = 'pending'
  )
ON CONFLICT DO NOTHING;

INSERT INTO public.users (id, active_household_id, display_name)
SELECT
  au.id,
  h.id,
  COALESCE(
    NULLIF(trim((au.raw_user_meta_data->>'display_name')::text), ''),
    split_part(COALESCE(au.email, ''), '@', 1),
    'Member'
  )
FROM auth.users au
JOIN public.households h ON h.created_by = au.id
LEFT JOIN public.users u ON u.id = au.id
WHERE u.id IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.household_join_requests r
    WHERE r.requester_id = au.id AND r.status = 'pending'
  )
ON CONFLICT (id) DO NOTHING;

-- 3) Make sure every users row has a corresponding household_members row.
INSERT INTO public.household_members (user_id, household_id)
SELECT u.id, u.active_household_id
FROM public.users u
WHERE u.active_household_id IS NOT NULL
ON CONFLICT DO NOTHING;

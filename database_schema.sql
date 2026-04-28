-- Budget planner cloud schema (Supabase / PostgreSQL)
-- Run in the Supabase SQL editor or via migrations.
--
-- This file is idempotent: every run drops/recreates policies and functions
-- but never drops user data. Run it whenever you change the schema.

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

-- Households: one row per shared budget space.
CREATE TABLE IF NOT EXISTS public.households (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Track who created each household so we know who can approve join requests.
ALTER TABLE public.households
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users (id);

-- Backfill `created_by` for older households using the earliest member.
UPDATE public.households h
SET created_by = sub.id
FROM (
  SELECT DISTINCT ON (u.household_id)
    u.household_id, u.id, u.created_at
  FROM public.users u
  ORDER BY u.household_id, u.created_at ASC
) sub
WHERE h.created_by IS NULL
  AND h.id = sub.household_id;

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
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.household_join_requests ENABLE ROW LEVEL SECURITY;

-- Helper that returns the household id of the currently authenticated user.
-- Defined as SECURITY DEFINER so it can read public.users without recursing
-- through that table's own RLS policies.
-- Uses CREATE OR REPLACE so existing policies that depend on it keep working.
CREATE OR REPLACE FUNCTION public.current_household_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT household_id
  FROM public.users
  WHERE id = auth.uid()
  LIMIT 1
$$;

REVOKE ALL ON FUNCTION public.current_household_id() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_household_id() TO authenticated;

-- USERS ---------------------------------------------------------------------
DROP POLICY IF EXISTS users_select_own ON public.users;
CREATE POLICY users_select_own
ON public.users FOR SELECT TO authenticated
USING (id = auth.uid());

DROP POLICY IF EXISTS users_select_same_household ON public.users;
CREATE POLICY users_select_same_household
ON public.users FOR SELECT TO authenticated
USING (household_id = public.current_household_id());

DROP POLICY IF EXISTS users_insert_self ON public.users;
CREATE POLICY users_insert_self
ON public.users FOR INSERT TO authenticated
WITH CHECK (id = auth.uid());

-- HOUSEHOLDS ----------------------------------------------------------------
DROP POLICY IF EXISTS households_insert_authenticated ON public.households;
CREATE POLICY households_insert_authenticated
ON public.households FOR INSERT TO authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS households_select_own ON public.households;
CREATE POLICY households_select_own
ON public.households FOR SELECT TO authenticated
USING (id = public.current_household_id());

-- Pending requesters need to read the household they applied to so the app
-- can show "Your request to join 'X' is pending".
DROP POLICY IF EXISTS households_select_for_requester ON public.households;
CREATE POLICY households_select_for_requester
ON public.households FOR SELECT TO authenticated
USING (
  id IN (
    SELECT household_id FROM public.household_join_requests
    WHERE requester_id = auth.uid()
  )
);

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
  household_id IN (
    SELECT id FROM public.households WHERE created_by = auth.uid()
  )
);

-- ---------------------------------------------------------------------------
-- Sign-up trigger: provisions the new user's profile and household.
-- - If `household_name` matches an existing household (case-insensitive):
--   create a pending join request and notify that household's owner.
-- - Otherwise: create a brand-new household and the user's profile.
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
    WHERE lower(name) = lower(v_household_name)
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

  INSERT INTO public.users (id, household_id, display_name)
  VALUES (NEW.id, v_new_household_id, v_display_name);

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

  INSERT INTO public.users (id, household_id, display_name)
  VALUES (v_req.requester_id, v_req.household_id, v_req.requester_display_name)
  ON CONFLICT (id) DO UPDATE
    SET household_id = EXCLUDED.household_id,
        display_name = EXCLUDED.display_name;

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
--    existed). This mirrors handle_new_user() for the "no household name" path.
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

INSERT INTO public.users (id, household_id, display_name)
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

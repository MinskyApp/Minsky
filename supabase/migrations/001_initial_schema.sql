-- ============================================================
-- Minsky — Initial Schema Migration
-- 001_initial_schema.sql
-- ============================================================

-- ─── Extensions ──────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── Enums ───────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('admin', 'editor', 'viewer');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─── profiles ────────────────────────────────────────────────
-- Mirrors auth.users; extended with role and display info.
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   TEXT,
  role        user_role   NOT NULL DEFAULT 'editor',
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index: role-based lookups
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles (role);

-- ─── tasks ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.tasks (
  id             UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  title          TEXT        NOT NULL,
  description    TEXT,
  status         TEXT        NOT NULL DEFAULT 'todo',
  kanban_column  TEXT        NOT NULL DEFAULT 'todo',
  assignee_id    UUID        REFERENCES public.profiles(id) ON DELETE SET NULL,
  due_date       DATE,
  created_by     UUID        REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes: common filter patterns
CREATE INDEX IF NOT EXISTS idx_tasks_status        ON public.tasks (status);
CREATE INDEX IF NOT EXISTS idx_tasks_kanban_column ON public.tasks (kanban_column);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee_id   ON public.tasks (assignee_id);
CREATE INDEX IF NOT EXISTS idx_tasks_created_by    ON public.tasks (created_by);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date      ON public.tasks (due_date);

-- ─── channels ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.channels (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT        NOT NULL,
  description TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index: name lookups
CREATE UNIQUE INDEX IF NOT EXISTS idx_channels_name ON public.channels (name);

-- ─── messages ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.messages (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  channel_id  UUID        NOT NULL REFERENCES public.channels(id) ON DELETE CASCADE,
  sender_id   UUID        REFERENCES public.profiles(id) ON DELETE SET NULL,
  content     TEXT        NOT NULL,
  file_url    TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes: paginated message loading
CREATE INDEX IF NOT EXISTS idx_messages_channel_id  ON public.messages (channel_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id   ON public.messages (sender_id);

-- ─── assets ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.assets (
  id            UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          TEXT        NOT NULL,
  storage_path  TEXT        NOT NULL,
  file_type     TEXT,
  file_size     BIGINT,
  uploaded_by   UUID        REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index: filter by uploader and type
CREATE INDEX IF NOT EXISTS idx_assets_uploaded_by ON public.assets (uploaded_by);
CREATE INDEX IF NOT EXISTS idx_assets_file_type   ON public.assets (file_type);

-- ============================================================
-- Row Level Security
-- ============================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets   ENABLE ROW LEVEL SECURITY;

-- ─── Helper: is the current user an admin? ───────────────────
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- ─── profiles policies ───────────────────────────────────────
-- Any authenticated user can read all profiles
CREATE POLICY "profiles_select_authenticated"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

-- Users can update their own profile; admins can update any
CREATE POLICY "profiles_update_own_or_admin"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid() OR public.is_admin())
  WITH CHECK (id = auth.uid() OR public.is_admin());

-- ─── tasks policies ──────────────────────────────────────────
CREATE POLICY "tasks_select_authenticated"
  ON public.tasks FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "tasks_insert_authenticated"
  ON public.tasks FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- Only creator or admin can update/delete
CREATE POLICY "tasks_update_creator_or_admin"
  ON public.tasks FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid() OR public.is_admin());

CREATE POLICY "tasks_delete_creator_or_admin"
  ON public.tasks FOR DELETE
  TO authenticated
  USING (created_by = auth.uid() OR public.is_admin());

-- ─── channels policies ───────────────────────────────────────
CREATE POLICY "channels_select_authenticated"
  ON public.channels FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "channels_insert_admin"
  ON public.channels FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "channels_update_admin"
  ON public.channels FOR UPDATE
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "channels_delete_admin"
  ON public.channels FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- ─── messages policies ───────────────────────────────────────
CREATE POLICY "messages_select_authenticated"
  ON public.messages FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "messages_insert_authenticated"
  ON public.messages FOR INSERT
  TO authenticated
  WITH CHECK (sender_id = auth.uid());

CREATE POLICY "messages_delete_sender_or_admin"
  ON public.messages FOR DELETE
  TO authenticated
  USING (sender_id = auth.uid() OR public.is_admin());

-- ─── assets policies ─────────────────────────────────────────
CREATE POLICY "assets_select_authenticated"
  ON public.assets FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "assets_insert_authenticated"
  ON public.assets FOR INSERT
  TO authenticated
  WITH CHECK (uploaded_by = auth.uid());

CREATE POLICY "assets_delete_uploader_or_admin"
  ON public.assets FOR DELETE
  TO authenticated
  USING (uploaded_by = auth.uid() OR public.is_admin());

-- ============================================================
-- Auto-create profile on sign-up trigger
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.raw_user_meta_data ->> 'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- Storage: minsky-assets bucket
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('minsky-assets', 'minsky-assets', false)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS policies
CREATE POLICY "storage_select_authenticated"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'minsky-assets');

CREATE POLICY "storage_insert_authenticated"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'minsky-assets' AND auth.uid() IS NOT NULL);

CREATE POLICY "storage_delete_owner_or_admin"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'minsky-assets'
    AND (owner = auth.uid() OR public.is_admin())
  );

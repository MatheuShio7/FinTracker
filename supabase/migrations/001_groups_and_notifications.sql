-- FinTracker: schema inicial para Grupos e Notificações
--
-- Como aplicar localmente:
-- 1. Supabase Dashboard → SQL Editor → colar e executar este arquivo
-- 2. Ou, com Supabase CLI configurado: supabase db push
--
-- Pré-requisito: tabela public.users já existente (id = auth.users.id)

-- ---------------------------------------------------------------------------
-- Notificações
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  icon text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id
  ON public.notifications(user_id);

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
  ON public.notifications(user_id)
  WHERE read_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_notifications_user_mfa
  ON public.notifications(user_id, type)
  WHERE type = 'mfa_disabled';

-- ---------------------------------------------------------------------------
-- Grupos
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  visibility text NOT NULL DEFAULT 'publico'
    CHECK (visibility IN ('publico', 'restrito', 'privado')),
  view_permission text NOT NULL DEFAULT 'ninguem'
    CHECK (view_permission IN ('todos', 'lideres', 'ninguem')),
  manage_permission text NOT NULL DEFAULT 'ninguem'
    CHECK (manage_permission IN ('todos', 'lideres', 'ninguem')),
  max_members integer
    CHECK (max_members IS NULL OR max_members > 0),
  founder_id uuid NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  invite_code text UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_groups_founder_id ON public.groups(founder_id);
CREATE INDEX IF NOT EXISTS idx_groups_visibility ON public.groups(visibility);

-- ---------------------------------------------------------------------------
-- Membros de grupo
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.group_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  is_founder boolean NOT NULL DEFAULT false,
  is_leader boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'pending_approval', 'pending_reconsent', 'invited')),
  consented_view text
    CHECK (consented_view IS NULL OR consented_view IN ('todos', 'lideres', 'ninguem')),
  consented_manage text
    CHECK (consented_manage IS NULL OR consented_manage IN ('todos', 'lideres', 'ninguem')),
  consented_at timestamptz,
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (group_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON public.group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user_id ON public.group_members(user_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_group_members_single_founder
  ON public.group_members(group_id)
  WHERE is_founder = true;

-- ---------------------------------------------------------------------------
-- Solicitações de entrada (grupos com aprovação)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.group_join_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected')),
  consented_view text
    CHECK (consented_view IS NULL OR consented_view IN ('todos', 'lideres', 'ninguem')),
  consented_manage text
    CHECK (consented_manage IS NULL OR consented_manage IN ('todos', 'lideres', 'ninguem')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (group_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_group_join_requests_group_id
  ON public.group_join_requests(group_id);

CREATE INDEX IF NOT EXISTS idx_group_join_requests_user_id
  ON public.group_join_requests(user_id);

-- ---------------------------------------------------------------------------
-- Convites
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.group_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  invited_by uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  invited_user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'revoked')),
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_group_invites_group_id ON public.group_invites(group_id);
CREATE INDEX IF NOT EXISTS idx_group_invites_invited_user_id ON public.group_invites(invited_user_id);
CREATE INDEX IF NOT EXISTS idx_group_invites_token ON public.group_invites(token);

-- FinTracker: RLS para tabelas de Grupos e Notificações
--
-- Como aplicar:
-- 1. Supabase Dashboard → SQL Editor
-- 2. Ou: supabase db push (com CLI configurado)
--
-- Nota: o backend Flask usa service_role e continua com acesso total.
-- As policies protegem acesso direto via Supabase client (anon/authenticated).

-- ---------------------------------------------------------------------------
-- Schema privado com funções auxiliares (evita recursão em policies)
-- ---------------------------------------------------------------------------

CREATE SCHEMA IF NOT EXISTS private;

REVOKE ALL ON SCHEMA private FROM PUBLIC;
GRANT USAGE ON SCHEMA private TO authenticated;

CREATE OR REPLACE FUNCTION private.is_active_group_member(
  p_group_id uuid,
  p_user_id uuid DEFAULT auth.uid()
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.group_members
    WHERE group_id = p_group_id
      AND user_id = p_user_id
      AND status = 'active'
  );
$$;

CREATE OR REPLACE FUNCTION private.is_group_leader_or_founder(
  p_group_id uuid,
  p_user_id uuid DEFAULT auth.uid()
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.group_members
    WHERE group_id = p_group_id
      AND user_id = p_user_id
      AND status = 'active'
      AND (is_leader OR is_founder)
  )
  OR EXISTS (
    SELECT 1
    FROM public.groups
    WHERE id = p_group_id
      AND founder_id = p_user_id
  );
$$;

CREATE OR REPLACE FUNCTION private.is_group_founder(
  p_group_id uuid,
  p_user_id uuid DEFAULT auth.uid()
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.groups
    WHERE id = p_group_id
      AND founder_id = p_user_id
  );
$$;

REVOKE ALL ON FUNCTION private.is_active_group_member(uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.is_group_leader_or_founder(uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.is_group_founder(uuid, uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION private.is_active_group_member(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION private.is_group_leader_or_founder(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION private.is_group_founder(uuid, uuid) TO authenticated;

-- ---------------------------------------------------------------------------
-- notifications
-- ---------------------------------------------------------------------------

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY notifications_select_own
  ON public.notifications
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY notifications_update_own
  ON public.notifications
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- INSERT/DELETE: apenas backend (service_role)

-- ---------------------------------------------------------------------------
-- groups
-- ---------------------------------------------------------------------------

ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY groups_select_discoverable_or_member
  ON public.groups
  FOR SELECT
  TO authenticated
  USING (
    visibility IN ('publico', 'restrito')
    OR founder_id = auth.uid()
    OR private.is_active_group_member(id)
  );

CREATE POLICY groups_insert_as_founder
  ON public.groups
  FOR INSERT
  TO authenticated
  WITH CHECK (founder_id = auth.uid());

CREATE POLICY groups_update_by_leaders
  ON public.groups
  FOR UPDATE
  TO authenticated
  USING (private.is_group_leader_or_founder(id))
  WITH CHECK (private.is_group_leader_or_founder(id));

CREATE POLICY groups_delete_by_founder
  ON public.groups
  FOR DELETE
  TO authenticated
  USING (private.is_group_founder(id));

-- ---------------------------------------------------------------------------
-- group_members
-- ---------------------------------------------------------------------------

ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY group_members_select_in_group
  ON public.group_members
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR private.is_active_group_member(group_id)
    OR private.is_group_leader_or_founder(group_id)
  );

CREATE POLICY group_members_insert_self_or_by_leaders
  ON public.group_members
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    OR private.is_group_leader_or_founder(group_id)
  );

CREATE POLICY group_members_update_by_leaders
  ON public.group_members
  FOR UPDATE
  TO authenticated
  USING (private.is_group_leader_or_founder(group_id))
  WITH CHECK (private.is_group_leader_or_founder(group_id));

CREATE POLICY group_members_update_self_consent
  ON public.group_members
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (
    user_id = auth.uid()
    AND is_founder = (
      SELECT gm.is_founder
      FROM public.group_members AS gm
      WHERE gm.id = group_members.id
    )
    AND is_leader = (
      SELECT gm.is_leader
      FROM public.group_members AS gm
      WHERE gm.id = group_members.id
    )
  );

CREATE POLICY group_members_delete_self_or_by_leaders
  ON public.group_members
  FOR DELETE
  TO authenticated
  USING (
    (user_id = auth.uid() AND NOT is_founder)
    OR (
      private.is_group_leader_or_founder(group_id)
      AND NOT is_founder
    )
  );

-- ---------------------------------------------------------------------------
-- group_join_requests
-- ---------------------------------------------------------------------------

ALTER TABLE public.group_join_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY group_join_requests_select_own_or_leaders
  ON public.group_join_requests
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR private.is_group_leader_or_founder(group_id)
  );

CREATE POLICY group_join_requests_insert_self
  ON public.group_join_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY group_join_requests_update_by_leaders
  ON public.group_join_requests
  FOR UPDATE
  TO authenticated
  USING (private.is_group_leader_or_founder(group_id))
  WITH CHECK (private.is_group_leader_or_founder(group_id));

CREATE POLICY group_join_requests_delete_self_or_leaders
  ON public.group_join_requests
  FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid()
    OR private.is_group_leader_or_founder(group_id)
  );

-- ---------------------------------------------------------------------------
-- group_invites
-- ---------------------------------------------------------------------------

ALTER TABLE public.group_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY group_invites_select_involved_or_leaders
  ON public.group_invites
  FOR SELECT
  TO authenticated
  USING (
    invited_user_id = auth.uid()
    OR invited_by = auth.uid()
    OR private.is_group_leader_or_founder(group_id)
  );

CREATE POLICY group_invites_insert_by_leaders
  ON public.group_invites
  FOR INSERT
  TO authenticated
  WITH CHECK (
    invited_by = auth.uid()
    AND private.is_group_leader_or_founder(group_id)
  );

CREATE POLICY group_invites_update_invited_or_leaders
  ON public.group_invites
  FOR UPDATE
  TO authenticated
  USING (
    invited_user_id = auth.uid()
    OR private.is_group_leader_or_founder(group_id)
  )
  WITH CHECK (
    invited_user_id = auth.uid()
    OR private.is_group_leader_or_founder(group_id)
  );

CREATE POLICY group_invites_delete_by_leaders
  ON public.group_invites
  FOR DELETE
  TO authenticated
  USING (private.is_group_leader_or_founder(group_id));

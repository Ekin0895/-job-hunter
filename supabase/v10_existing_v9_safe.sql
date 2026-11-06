-- Job Hunter V10: migration compatible avec la table V9 existante.
-- Prérequis vérifiés dans Supabase : public.job_offers possède
-- id uuid DEFAULT gen_random_uuid(), user_id, local_id, data,
-- created_at, updated_at, UNIQUE(user_id,local_id), RLS et 4 policies.
-- Ne crée, ne supprime ni ne modifie aucune candidature existante.
-- Conserve les policies et le trigger job_offers_updated_at de la V9.
BEGIN;

CREATE OR REPLACE FUNCTION public.job_hunter_save(
  p_local_id text,
  p_data jsonb,
  p_expected_updated_at timestamptz
)
RETURNS TABLE(saved_updated_at timestamptz)
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_existing_updated_at timestamptz;
  v_saved_updated_at timestamptz;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Utilisateur non connecté';
  END IF;
  IF p_local_id IS NULL OR length(pg_catalog.btrim(p_local_id)) = 0
     OR p_data IS NULL OR pg_catalog.jsonb_typeof(p_data) <> 'object'
     OR p_data->>'id' IS DISTINCT FROM p_local_id THEN
    RAISE EXCEPTION 'Paramètres invalides';
  END IF;

  PERFORM pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(v_user_id::text || ':' || p_local_id, 0)
  );

  SELECT updated_at INTO v_existing_updated_at
  FROM public.job_offers
  WHERE user_id = v_user_id AND local_id = p_local_id
  FOR UPDATE;

  IF FOUND THEN
    IF p_expected_updated_at IS NULL
       OR v_existing_updated_at IS DISTINCT FROM p_expected_updated_at THEN
      RAISE EXCEPTION 'CONFLIT_SYNCHRONISATION';
    END IF;

    UPDATE public.job_offers
    SET data = p_data
    WHERE user_id = v_user_id AND local_id = p_local_id
    RETURNING updated_at INTO v_saved_updated_at;
  ELSE
    IF p_expected_updated_at IS NOT NULL THEN
      RAISE EXCEPTION 'CONFLIT_SYNCHRONISATION';
    END IF;

    INSERT INTO public.job_offers(user_id, local_id, data)
    VALUES (v_user_id, p_local_id, p_data)
    RETURNING updated_at INTO v_saved_updated_at;
  END IF;

  RETURN QUERY SELECT v_saved_updated_at;
END;
$$;

REVOKE ALL ON FUNCTION public.job_hunter_save(text, jsonb, timestamptz) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.job_hunter_save(text, jsonb, timestamptz) TO authenticated;

CREATE OR REPLACE FUNCTION public.job_hunter_delete(
  p_local_id text,
  p_expected_updated_at timestamptz
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_existing_updated_at timestamptz;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Utilisateur non connecté';
  END IF;
  IF p_local_id IS NULL OR length(pg_catalog.btrim(p_local_id)) = 0
     OR p_expected_updated_at IS NULL THEN
    RAISE EXCEPTION 'Paramètres invalides';
  END IF;

  PERFORM pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(v_user_id::text || ':' || p_local_id, 0)
  );

  SELECT updated_at INTO v_existing_updated_at
  FROM public.job_offers
  WHERE user_id = v_user_id AND local_id = p_local_id
  FOR UPDATE;

  IF NOT FOUND OR v_existing_updated_at IS DISTINCT FROM p_expected_updated_at THEN
    RAISE EXCEPTION 'CONFLIT_SYNCHRONISATION';
  END IF;

  DELETE FROM public.job_offers
  WHERE user_id = v_user_id
    AND local_id = p_local_id
    AND updated_at = p_expected_updated_at;

  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.job_hunter_delete(text, timestamptz) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.job_hunter_delete(text, timestamptz) TO authenticated;

COMMIT;

-- V10: suppression conditionnelle et atomique.
-- À exécuter dans le SQL Editor Supabase APRÈS installation de job_hunter_save.
-- Aucun enregistrement existant n'est supprimé lors de la création de cette fonction.
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
  IF p_local_id IS NULL OR length(trim(p_local_id)) = 0
     OR p_expected_updated_at IS NULL THEN
    RAISE EXCEPTION 'Paramètres invalides';
  END IF;

  PERFORM pg_advisory_xact_lock(
    hashtextextended(v_user_id::text || ':' || p_local_id, 0)
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

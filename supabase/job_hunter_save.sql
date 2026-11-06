-- V10: création/mise à jour conditionnelle d'une candidature.
-- À examiner avec le schéma Supabase du projet avant application.
-- Aucun enregistrement n'est supprimé par ce script.

CREATE TABLE IF NOT EXISTS public.job_offers (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  local_id text NOT NULL,
  data jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  PRIMARY KEY (user_id, local_id)
);

ALTER TABLE public.job_offers ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.job_offers TO authenticated;

DROP POLICY IF EXISTS job_offers_own_rows ON public.job_offers;
CREATE POLICY job_offers_own_rows ON public.job_offers
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- This trigger sorts after the existing set_job_offer_updated_at trigger by
-- name, keeping the version strictly increasing even for rapid successive writes.
CREATE OR REPLACE FUNCTION public.job_hunter_monotonic_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    NEW.updated_at := GREATEST(
      pg_catalog.clock_timestamp(),
      OLD.updated_at + interval '1 microsecond'
    );
  ELSE
    NEW.updated_at := COALESCE(NEW.updated_at, pg_catalog.clock_timestamp());
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS zzz_v10_job_hunter_monotonic_updated_at ON public.job_offers;
CREATE TRIGGER zzz_v10_job_hunter_monotonic_updated_at
  BEFORE INSERT OR UPDATE ON public.job_offers
  FOR EACH ROW EXECUTE FUNCTION public.job_hunter_monotonic_updated_at();

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
  IF p_local_id IS NULL OR length(trim(p_local_id)) = 0 OR p_data IS NULL
     OR jsonb_typeof(p_data) <> 'object'
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
    SET data = p_data,
        updated_at = GREATEST(
          pg_catalog.clock_timestamp(),
          v_existing_updated_at + interval '1 microsecond'
        )
    WHERE user_id = v_user_id AND local_id = p_local_id
    RETURNING updated_at INTO v_saved_updated_at;
  ELSE
    IF p_expected_updated_at IS NOT NULL THEN
      RAISE EXCEPTION 'CONFLIT_SYNCHRONISATION';
    END IF;

    INSERT INTO public.job_offers(user_id, local_id, data, updated_at)
    VALUES (v_user_id, p_local_id, p_data, pg_catalog.clock_timestamp())
    RETURNING updated_at INTO v_saved_updated_at;
  END IF;

  RETURN QUERY SELECT v_saved_updated_at;
END;
$$;

REVOKE ALL ON FUNCTION public.job_hunter_save(text, jsonb, timestamptz) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.job_hunter_save(text, jsonb, timestamptz) TO authenticated;

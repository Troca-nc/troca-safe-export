-- ============================================================
-- Kalico - Plan Pro Fret
-- Ajout d'un flag de plan fret dédié sur les comptes users
-- ============================================================

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS has_fret_plan BOOLEAN NOT NULL DEFAULT FALSE;


-- ── Migration SQL — Vérification téléphone ────────────────────────────────────
-- À ajouter à votre fichier de migration existant

-- Ajout des colonnes sur la table users
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS telephone          VARCHAR(20)  DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS telephone_verifie  BOOLEAN      NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS telephone_verifie_at TIMESTAMPTZ DEFAULT NULL;

-- Index pour éviter les doublons de numéros vérifiés
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_telephone_verifie
  ON users (telephone)
  WHERE telephone_verifie = TRUE;

-- Index de recherche
CREATE INDEX IF NOT EXISTS idx_users_telephone
  ON users (telephone)
  WHERE telephone IS NOT NULL;

-- Vue pour l'admin : utilisateurs avec statut de vérification
CREATE OR REPLACE VIEW users_verification_status AS
SELECT
  id,
  prenom,
  nom,
  email,
  telephone,
  telephone_verifie,
  telephone_verifie_at,
  CASE
    WHEN telephone_verifie = TRUE THEN 'vérifié'
    WHEN telephone IS NOT NULL    THEN 'en_attente'
    ELSE                               'non_renseigné'
  END AS statut_telephone
FROM users;

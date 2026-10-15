-- Catégories principales proposées lors du dépôt d'une annonce.
-- L'upsert conserve les identifiants existants afin de ne modifier aucune annonce.

WITH desired_categories (name, slug, icon, position) AS (
  VALUES
    ('Véhicules', 'vehicules', '🚗', 10),
    ('Pièces & Équipement', 'pieces-equipement', '🔧', 20),
    ('Nautisme', 'nautisme', '⛵', 30),
    ('Maison & Jardin', 'maison-jardin', '🛋️', 40),
    ('Bricolage & Outillage', 'bricolage-outillage', '🛠️', 50),
    ('Électronique & Multimédia', 'multimedia', '💻', 60),
    ('Mode & Accessoires', 'mode', '👕', 70),
    ('Famille & Puériculture', 'famille-puericulture', '🧸', 80),
    ('Sports & Loisirs', 'sports-loisirs', '🏄', 90),
    ('Collections & Antiquités', 'collections-antiquites', '🎁', 100),
    ('Animaux', 'animaux', '🐾', 110),
    ('Agriculture', 'agriculture', '🌾', 120),
    ('Matériel professionnel', 'materiel-professionnel', '📦', 130),
    ('Immobilier', 'immobilier', '🏠', 140),
    ('Services entre particuliers', 'services', '🤝', 150),
    ('Emploi', 'emploi', '💼', 160),
    ('Locations courte durée', 'location_courte_duree', '🗓️', 170),
    ('Dons', 'don', '🎁', 180),
    ('Divers', 'divers', '📦', 190)
)
INSERT INTO categories (name, slug, icon, position, sort_order)
SELECT name, slug, icon, position, position
FROM desired_categories
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  icon = EXCLUDED.icon,
  position = EXCLUDED.position,
  sort_order = EXCLUDED.sort_order;

UPDATE categories
SET name = 'Location longue durée'
WHERE slug = 'location-longue-duree'
  AND name IS DISTINCT FROM 'Location longue durée';

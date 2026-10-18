-- Sous-catégories de publication Kalico.
--
-- Les catégories principales sont conservées telles quelles afin de préserver
-- les annonces existantes. Les slugs enfants sont préfixés par leur famille :
-- ils restent uniques, explicites et stables même lorsque deux familles
-- utilisent le même libellé (par exemple « Accessoires »).

WITH desired_subcategories (parent_slug, name, slug, icon, position) AS (
  VALUES
    ('vehicules', 'Voitures', 'vehicules-voitures', '🚗', 10),
    ('vehicules', 'Utilitaires & Professionnels', 'vehicules-utilitaires-professionnels', '🚚', 20),
    ('vehicules', 'Motos & Scooters', 'vehicules-motos-scooters', '🏍️', 30),
    ('vehicules', 'Vélos & Trottinettes', 'vehicules-velos-trottinettes', '🚲', 40),

    ('pieces-equipement', 'Pièces auto', 'pieces-equipement-pieces-auto', '🔧', 10),
    ('pieces-equipement', 'Équipement moto', 'pieces-equipement-moto', '🏍️', 20),
    ('pieces-equipement', 'Équipement vélo', 'pieces-equipement-velo', '🚲', 30),
    ('pieces-equipement', 'Accessoires véhicules', 'pieces-equipement-accessoires-vehicules', '🧰', 40),

    ('nautisme', 'Bateaux', 'nautisme-bateaux', '⛵', 10),
    ('nautisme', 'Sports nautiques', 'nautisme-sports-nautiques', '🏄', 20),
    ('nautisme', 'Équipement & Accessoires', 'nautisme-equipement-accessoires', '⚓', 30),

    ('maison-jardin', 'Mobilier', 'maison-jardin-mobilier', '🛋️', 10),
    ('maison-jardin', 'Électroménager', 'maison-jardin-electromenager', '🏠', 20),
    ('maison-jardin', 'Décoration & Linge', 'maison-jardin-decoration-linge', '🖼️', 30),
    ('maison-jardin', 'Jardin & Plantes', 'maison-jardin-jardin-plantes', '🌿', 40),
    ('maison-jardin', 'Autres équipements de la maison', 'maison-jardin-autres', '📦', 50),

    ('bricolage-outillage', 'Électricité', 'bricolage-outillage-electricite', '⚡', 10),
    ('bricolage-outillage', 'Plomberie', 'bricolage-outillage-plomberie', '🔧', 20),
    ('bricolage-outillage', 'Peinture & Revêtements', 'bricolage-outillage-peinture-revetements', '🖌️', 30),
    ('bricolage-outillage', 'Menuiserie & Bois', 'bricolage-outillage-menuiserie-bois', '🪚', 40),
    ('bricolage-outillage', 'Maçonnerie & Carrelage', 'bricolage-outillage-maconnerie-carrelage', '🧱', 50),
    ('bricolage-outillage', 'Isolation & Cloisons', 'bricolage-outillage-isolation-cloisons', '🏗️', 60),
    ('bricolage-outillage', 'Quincaillerie & Fixations', 'bricolage-outillage-quincaillerie-fixations', '🔩', 70),
    ('bricolage-outillage', 'Outillage électroportatif', 'bricolage-outillage-electroportatif', '🛠️', 80),
    ('bricolage-outillage', 'Outillage à main', 'bricolage-outillage-main', '🔨', 90),
    ('bricolage-outillage', 'Échelles & Échafaudages', 'bricolage-outillage-echelles-echafaudages', '🪜', 100),
    ('bricolage-outillage', 'Rangement d’atelier', 'bricolage-outillage-rangement-atelier', '🧰', 110),
    ('bricolage-outillage', 'Sécurité & EPI', 'bricolage-outillage-securite-epi', '🦺', 120),
    ('bricolage-outillage', 'Autres', 'bricolage-outillage-autres', '📦', 130),

    ('multimedia', 'Informatique', 'multimedia-informatique', '💻', 10),
    ('multimedia', 'Téléphonie', 'multimedia-telephonie', '📱', 20),
    ('multimedia', 'Montres & Objets connectés', 'multimedia-objets-connectes', '⌚', 30),
    ('multimedia', 'Image & Son', 'multimedia-image-son', '📺', 40),
    ('multimedia', 'Jeux vidéo', 'multimedia-jeux-video', '🎮', 50),

    ('mode', 'Femmes', 'mode-femmes', '👗', 10),
    ('mode', 'Hommes', 'mode-hommes', '👕', 20),
    ('mode', 'Enfants & Bébés', 'mode-enfants-bebes', '🧸', 30),

    ('famille-puericulture', 'Poussettes, landaus & Sièges auto', 'famille-puericulture-poussettes-sieges-auto', '👶', 10),
    ('famille-puericulture', 'Mobilier enfant', 'famille-puericulture-mobilier-enfant', '🛏️', 20),
    ('famille-puericulture', 'Linge & Matelas', 'famille-puericulture-linge-matelas', '🧺', 30),
    ('famille-puericulture', 'Accessoires', 'famille-puericulture-accessoires', '🍼', 40),
    ('famille-puericulture', 'Jeux', 'famille-puericulture-jeux', '🧩', 50),
    ('famille-puericulture', 'Doudous & Peluches', 'famille-puericulture-peluches', '🧸', 60),

    ('sports-loisirs', 'Sports & Plein air', 'sports-loisirs-sports-plein-air', '🏄', 10),
    ('sports-loisirs', 'Musique & Instruments', 'sports-loisirs-musique', '🎸', 20),
    ('sports-loisirs', 'Livres & Lecture', 'sports-loisirs-livres', '📚', 30),
    ('sports-loisirs', 'Jeux de société', 'sports-loisirs-jeux-societe', '🎲', 40),
    ('sports-loisirs', 'Loisirs créatifs', 'sports-loisirs-creatifs', '🎨', 50),
    ('sports-loisirs', 'Modélisme', 'sports-loisirs-modelisme', '🧩', 60),
    ('sports-loisirs', 'Airsoft & Tir', 'sports-loisirs-airsoft-tir', '🎯', 70),
    ('sports-loisirs', 'Loisirs pour enfants', 'sports-loisirs-enfants', '🛝', 80),

    ('collections-antiquites', 'Antiquités', 'collections-antiquites-antiquites', '🏺', 10),
    ('collections-antiquites', 'Art & Décoration', 'collections-antiquites-art-decoration', '🖼️', 20),
    ('collections-antiquites', 'Monnaies & Timbres', 'collections-antiquites-monnaies-timbres', '🪙', 30),
    ('collections-antiquites', 'Cartes & Souvenirs', 'collections-antiquites-cartes-souvenirs', '🎴', 40),
    ('collections-antiquites', 'Autres collections', 'collections-antiquites-autres', '🎁', 50),

    ('animaux', 'Chiens', 'animaux-chiens', '🐕', 10),
    ('animaux', 'Chats', 'animaux-chats', '🐈', 20),
    ('animaux', 'Chevaux', 'animaux-chevaux', '🐎', 30),
    ('animaux', 'Rongeurs', 'animaux-rongeurs', '🐹', 40),
    ('animaux', 'Animaux de ferme', 'animaux-ferme', '🐓', 50),
    ('animaux', 'Adoption & Sauvetage', 'animaux-adoption-sauvetage', '🐾', 60),
    ('animaux', 'Perdus & Trouvés', 'animaux-perdus-trouves', '🔎', 70),
    ('animaux', 'Alimentation & Accessoires', 'animaux-alimentation-accessoires', '🦴', 80),
    ('animaux', 'Reproduction & Saillies', 'animaux-reproduction-saillies', '🐾', 90),
    ('animaux', 'Autres', 'animaux-autres', '🐾', 100),

    ('agriculture', 'Matériel & Machines agricoles', 'agriculture-materiel-machines', '🚜', 10),
    ('agriculture', 'Élevage', 'agriculture-elevage', '🐄', 20),
    ('agriculture', 'Semences & Plants', 'agriculture-semences-plants', '🌱', 30),
    ('agriculture', 'Produits agricoles', 'agriculture-produits', '🌾', 40),
    ('agriculture', 'Exploitations & Terrains', 'agriculture-exploitations-terrains', '🗺️', 50),

    ('materiel-professionnel', 'Agriculture & Espaces verts', 'materiel-professionnel-agriculture-espaces-verts', '🌿', 10),
    ('materiel-professionnel', 'BTP & Industrie', 'materiel-professionnel-btp-industrie', '🏗️', 20),
    ('materiel-professionnel', 'Restauration & Commerce', 'materiel-professionnel-restauration-commerce', '🏪', 30),
    ('materiel-professionnel', 'Bureaux', 'materiel-professionnel-bureaux', '🖨️', 40),
    ('materiel-professionnel', 'Médical', 'materiel-professionnel-medical', '🩺', 50),

    ('immobilier', 'Vente', 'vente', '🏡', 10),
    ('immobilier', 'Location longue durée', 'location-longue-duree', '🏠', 20),

    ('services', 'Travaux & Dépannages', 'services-travaux-depannages', '🛠️', 10),
    ('services', 'Jardinage, Piscine & Spa', 'services-jardinage-piscine-spa', '🌿', 20),
    ('services', 'Ménage', 'services-menage', '🧹', 30),
    ('services', 'Déménagement & Livraison', 'services-demenagement-livraison', '🚚', 40),
    ('services', 'Services à la personne', 'services-personne', '🤝', 50),
    ('services', 'Garde d’enfants', 'services-garde-enfants', '👶', 60),
    ('services', 'Soins à la personne', 'services-soins-personne', '🩺', 70),
    ('services', 'Sports & Santé', 'services-sports-sante', '🏃', 80),
    ('services', 'Mode, Beauté & Bien-être', 'services-mode-beaute-bien-etre', '✨', 90),
    ('services', 'Administratif', 'services-administratif', '📄', 100),
    ('services', 'Cours particuliers', 'services-cours-particuliers', '🎓', 110),

    ('emploi', 'Offres d’emploi', 'emploi-offres', '💼', 10),
    ('emploi', 'Formations professionnelles', 'emploi-formations', '🎓', 20),

    ('location_courte_duree', 'Logement entier', 'location-courte-duree-logement-entier', '🏠', 10),
    ('location_courte_duree', 'Chambre', 'location-courte-duree-chambre', '🛏️', 20),
    ('location_courte_duree', 'Hébergement atypique', 'location-courte-duree-hebergement-atypique', '⛺', 30),
    ('location_courte_duree', 'Location saisonnière', 'location-courte-duree-saisonniere', '🏖️', 40),

    ('don', 'Maison & Mobilier', 'dons-maison-mobilier', '🛋️', 10),
    ('don', 'Vêtements', 'dons-vetements', '👕', 20),
    ('don', 'Enfants & Puériculture', 'dons-enfants-puericulture', '🧸', 30),
    ('don', 'Électronique', 'dons-electronique', '💻', 40),
    ('don', 'Autres dons', 'dons-autres', '🎁', 50)
)
INSERT INTO categories (parent_id, name, slug, icon, position, sort_order)
SELECT parent.id, desired.name, desired.slug, desired.icon, desired.position, desired.position
FROM desired_subcategories desired
JOIN categories parent ON parent.slug = desired.parent_slug
ON CONFLICT (slug) DO UPDATE SET
  parent_id = EXCLUDED.parent_id,
  name = EXCLUDED.name,
  icon = EXCLUDED.icon,
  position = EXCLUDED.position,
  sort_order = EXCLUDED.sort_order;

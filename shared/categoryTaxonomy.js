'use strict';

function n(name, children = []) {
  return { name, children };
}

function slugifyCategoryName(value) {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/×/g, 'x')
    .replace(/&/g, ' ')
    .replace(/['’]/g, '')
    .replace(/[^\p{Letter}\p{Number}]+/gu, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}

function normalizeCategoryText(...parts) {
  return parts
    .filter(Boolean)
    .join(' ')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function inferCategoryIconKey(name, slug, path = []) {
  const text = normalizeCategoryText(name, slug, ...path);

  if (/(pieces|equipement auto|equipement deux roues|moteurs|frein|suspensions|echappement|carrosseries|parechocs|eclairages|vitres|electronique auto|attelages|barres|tuning|sonorisation|epaves|entretien|jantes|pneus)/.test(text)) {
    return 'wrench';
  }

  if (/(utilitaires|camion|poids lourds|remorques|engins|transport|logistique)/.test(text)) {
    return 'truck';
  }

  if (/(motos|scooters|quad)/.test(text)) {
    return 'bike';
  }

  if (/(velos|trottinettes|vtc|vtt|vae|roller|skate)/.test(text)) {
    return 'bike';
  }

  if (/(bateaux|voiliers|multicoques|annexes|nautiques|marine|mouillage|accastillage|remorques nautisme)/.test(text)) {
    return 'ship';
  }

  if (/(peche|plongee|kite|windsurf|sup|sports nautiques)/.test(text)) {
    return 'waves';
  }

  if (/(appartements|maisons|terrains|docks|entrepots|bureaux|commerces|parkings|colocations)/.test(text)) {
    if (/(bureaux|commerces|docks|entrepots)/.test(text)) {
      return 'building';
    }
    if (/(parkings)/.test(text)) {
      return 'car';
    }
    return 'home';
  }

  if (/(agriculture|espaces verts|jardinage|piscine|spa|plantes|semences)/.test(text)) {
    return 'sprout';
  }

  if (/(btp|construction|travaux|depannages|outillage|bricolage)/.test(text)) {
    return 'hammer';
  }

  if (/(commerce|distribution|boutique|magasin|restauration|hôtellerie|hotellerie|tourisme)/.test(text)) {
    return 'store';
  }

  if (/(banque|finance|assurance|tarif|prix|salaire)/.test(text)) {
    return 'banknote';
  }

  if (/(industrie|environnement|médical|medical)/.test(text)) {
    return 'factory';
  }

  if (/(santé|sante|soins|stages|benevolat|jobs etudiants|formation|etudiant|étudiant)/.test(text)) {
    return 'stethoscope';
  }

  if (/(telecom|internet|medias|médias|photo|son|audio|electronique|multimedia|multimédia|smartphone|ordinateur|tv|television|télévision)/.test(text)) {
    if (/(photo|camera)/.test(text)) return 'camera';
    if (/(son|audio|casque|headphones)/.test(text)) return 'headphones';
    if (/(tv|television)/.test(text)) return 'tv';
    if (/(jeu|gaming|game)/.test(text)) return 'gamepad';
    if (/(ordinateur|laptop|pc|mac)/.test(text)) return 'laptop';
    return 'smartphone';
  }

  if (/(mode|vetements|vêtements|chaussures|sacs|accessoires|beaute|beauté|bijoux|foulards|ceintures|chapeaux|casquettes|lunettes|montres|parfums|maquillage)/.test(text)) {
    if (/(chaussures|baskets|sandales|mocassins|bottes|claquettes|tongs)/.test(text)) return 'shoe';
    if (/(sacs|pochettes|porte-monnaie|portemonnaie|trousses)/.test(text)) return 'shopping-bag';
    if (/(beaute|beauté|parfums|maquillage|bijoux|montres|foulards|ceintures|chapeaux|casquettes|lunettes)/.test(text)) return 'sparkles';
    return 'shirt';
  }

  if (/(famille|puericulture|puériculture|enfants|enfant|bébé|bebe|garde d'enfants|garde denfants)/.test(text)) {
    return 'baby';
  }

  if (/(loisirs|musique|lecture|jeux|sport|fitness|camping|creatifs|créatifs|modelisme|modélisme|airsoft|tir)/.test(text)) {
    if (/(musique|instruments|cd|vinyles)/.test(text)) return 'music';
    if (/(lecture|livres|revues|bd)/.test(text)) return 'book';
    if (/(jeux|societe|société|gaming)/.test(text)) return 'gamepad';
    if (/(creatifs|créatifs|modelisme|modélisme|airsoft|tir)/.test(text)) return 'target';
    return 'dumbbell';
  }

  if (/(collections|antiquites|antiquités)/.test(text)) {
    return 'gift';
  }

  if (/(animaux|chiens|chats|chevaux|rongeurs|adoption|perdus|trouves|trouvés)/.test(text)) {
    if (/(chiens|chien)/.test(text)) return 'dog';
    if (/(chats|chat)/.test(text)) return 'cat';
    if (/(chevaux|cheval)/.test(text)) return 'horse';
    return 'paw';
  }

  if (/(services|depannages|demenagement|déménagement|livraison|cours particuliers|administratif|garde d'enfants|soins|sports|sante|santé|beaute|beauté|bien-etre|bien-être)/.test(text)) {
    if (/(demenagement|livraison|transport)/.test(text)) return 'truck';
    if (/(administratif|cours particuliers)/.test(text)) return 'file-text';
    return 'handshake';
  }

  if (/(materiel professionnel|matériel professionnel|agriculture|btp|bureaux|médical|medical|restauration|commerce)/.test(text)) {
    if (/(agriculture)/.test(text)) return 'sprout';
    if (/(btp)/.test(text)) return 'hammer';
    if (/(bureaux|commerce)/.test(text)) return 'store';
    if (/(médical|medical)/.test(text)) return 'stethoscope';
    return 'package';
  }

  if (/(vente|location|immobilier)/.test(text)) {
    return 'home';
  }

  if (/(emploi|offres d'emploi|offres|formations professionnelles)/.test(text)) {
    return 'briefcase';
  }

  if (/(divers)/.test(text)) {
    return 'layers';
  }

  return 'layers';
}

const TAXONOMY_TREE = [
  n('Véhicules', [
    n('Voitures', [
      n('Citadines'),
      n('Berlines'),
      n('SUV/4x4'),
      n('Breaks'),
      n('Monospaces & Vans'),
      n('Cabriolets'),
      n('Voitures de sport'),
      n('Voitures de collection'),
      n('Voiturettes'),
    ]),
    n('Utilitaires & Professionnels', [
      n('Utilitaires légers'),
      n('Fourgons utilitaires'),
      n('Poids lourds'),
      n('Engins (TP/agricoles)'),
      n('Remorques'),
    ]),
    n('Motos & Scooters', [
      n('Routières'),
      n('Sportives'),
      n('Roadsters'),
      n('Custom'),
      n('Trails/Enduro/Cross'),
      n('Collection'),
      n('125cc et moins'),
      n('Scooters -125cm²'),
      n('Scooters +125cm²'),
      n('Scooters 3 roues'),
      n('Quads enfant & adulte'),
    ]),
    n('Vélos & Trottinettes', [
      n('VTC'),
      n('Vélo de route'),
      n('VTT'),
      n('Vélo électrique (VAE)'),
      n('Vélo enfant'),
      n('Vélo free-style'),
      n('Trottinettes'),
    ]),
  ]),
  n('Pièces & Équipement', [
    n('Pièces auto', [
      n('Jantes'),
      n('Pneus'),
      n('Moteurs complets'),
      n('Pièces châssis'),
      n('Pièces moteurs'),
      n('Pièces habitacle'),
      n('Freinage'),
      n('Suspensions'),
      n('Échappement'),
      n('Carrosserie & Pare-chocs'),
      n('Éclairages'),
      n('Vitres & Optiques'),
      n('Électronique auto'),
      n('Attelages & Barres'),
      n('Tuning & Sonorisation'),
      n('Entretien & Consommables'),
      n('Épaves'),
    ]),
    n('Pièces & Équipement moto', [
      n('Équipement motard'),
      n('Casques'),
      n('Pièces moto'),
      n('Pièces scooter'),
    ]),
    n('Pièces & Équipement vélo', [
      n('Équipement cycliste'),
      n('Pièces vélo'),
      n('Pièces trottinette'),
    ]),
    n('Accessoires véhicules', [
      n('GPS & Électronique'),
      n('Sécurité & Antivol'),
      n('Coffres de toit'),
      n('Divers'),
    ]),
  ]),
  n('Nautisme', [
    n('Bateaux', [
      n('Voiliers monocoques'),
      n('Multicoques'),
      n('Bateaux moteur'),
      n('Annexes'),
    ]),
    n('Sports nautiques', [
      n('Motos marines'),
      n('Kite/Windsurf/SUP'),
      n('Matériel de pêche'),
      n('Matériel de plongée'),
    ]),
    n('Équipement & accessoires', [
      n('Motorisation'),
      n('Accastillage'),
      n('Électronique'),
      n('Mouillage & vie à bord'),
      n('Gilets'),
      n('Remorques nautisme'),
      n('Équipement divers'),
    ]),
  ]),
  n('Immobilier', [
    n('Vente', [
      n('Appartements'),
      n('Maisons/Villas'),
      n('Terrains'),
      n('Docks/Entrepôts'),
      n('Bureaux & Commerces'),
      n('Parkings'),
    ]),
    n('Location', [
      n('Appartements'),
      n('Maisons/Villas'),
      n('Docks/Entrepôts'),
      n('Bureaux & Commerces'),
      n('Terrains'),
      n('Parkings'),
      n('Colocations'),
    ]),
  ]),
  n('Emploi', [
    n("Offres d'emploi", [
      n('Agriculture'),
      n('Automobile'),
      n('BTP & Construction'),
      n('Commerce & Distribution'),
      n('Banque/Assurance/Finance'),
      n('Industrie & Environnement'),
      n('Immobilier'),
      n('Services publics & Administrations'),
      n('Santé'),
      n('Services'),
      n('Télécom/Internet/Médias'),
      n('Transport & Logistique'),
      n('Restaurant/Hôtellerie/Tourisme'),
      n('Textile/Mode/Luxe'),
      n('Sport'),
      n('Service à la personne'),
      n("Emplois d'appoint"),
      n('Jobs étudiants'),
      n('Stage/Bénévolat'),
      n('Autre'),
    ]),
    n('Formations professionnelles'),
  ]),
  n('Mode', [
    n('Femmes', [
      n('Vêtements', [
        n('Manteaux & Vestes'),
        n('Sweats'),
        n('Blazers & Tailleurs'),
        n('Robes'),
        n('Jupes'),
        n('Hauts & T-shirts'),
        n('Jeans'),
        n('Pantalons & Leggings'),
        n('Shorts'),
        n('Combinaisons'),
        n('Maillots de bain'),
        n('Lingerie & Pyjamas'),
        n('Maternité'),
        n('Vêtements de sport'),
        n('Autres'),
      ]),
      n('Chaussures', [
        n('Ballerines'),
        n('Mocassins'),
        n('Bottes'),
        n('Chaussures de travail'),
        n('Claquettes'),
        n('Chaussures à talons'),
        n('Sandales'),
        n('Chaussons'),
        n('Chaussures de sport'),
        n('Baskets'),
      ]),
      n('Sacs', [
        n('Sacs à dos'),
        n('Sacs de plage'),
        n('Sacs banane & bandoulière'),
        n('Pochettes'),
        n('Sacs de sport'),
        n('Sacs à main'),
        n('Sacs de voyage'),
        n('Trousses à maquillage'),
        n('Porte-monnaie'),
      ]),
      n('Accessoires', [
        n('Foulards'),
        n('Ceintures'),
        n('Accessoires cheveux'),
        n('Chapeaux & Casquettes'),
        n('Bijoux'),
        n('Lunettes de soleil'),
        n('Parapluies'),
        n('Montres'),
        n('Autres'),
      ]),
      n('Beauté', [
        n('Maquillage'),
        n('Parfums'),
        n('Visage'),
        n('Mains'),
        n('Corps'),
        n('Cheveux'),
        n('Accessoires de beauté'),
        n('Autres cosmétiques'),
      ]),
    ]),
    n('Hommes', [
      n('Vêtements', [
        n('Jeans'),
        n('Manteaux & Vestes'),
        n('Hauts & T-shirts'),
        n('Costumes & Blazers'),
        n('Sweats & Pulls'),
        n('Pantalons'),
        n('Shorts'),
        n('Sous-vêtements & Chaussettes'),
        n('Pyjamas'),
        n('Maillots de bain'),
        n('Vêtements de sport'),
        n('Autres'),
      ]),
      n('Chaussures', [
        n('Mocassins'),
        n('Claquettes & Tongs'),
        n('Chaussures habillées'),
        n('Sandales'),
        n('Chaussons'),
        n('Chaussures de sport'),
        n('Baskets'),
        n('Chaussures de travail'),
      ]),
      n('Accessoires', [
        n('Sacs & Sacoches'),
        n('Ceintures'),
        n('Chapeaux & Casquettes'),
        n('Bijoux'),
        n('Lunettes de soleil'),
        n('Cravates & Nœuds papillons'),
        n('Montres'),
        n('Autres'),
      ]),
      n('Soins', [
        n('Soins visage'),
        n('Soins cheveux'),
        n('Soins du corps'),
        n('Parfums'),
        n('Autres cosmétiques'),
      ]),
    ]),
    n('Enfants & Bébés', [
      n('Bébé', [n('fille'), n('garçon')]),
      n('Enfant', [n('fille'), n('garçon')]),
      n('Ados', [n('fille'), n('garçon')]),
      n('Chaussures', [n('fille'), n('garçon')]),
    ]),
  ]),
  n('Maison & Jardin', [
    n('Mobilier', [
      n('Canapés/Fauteuils'),
      n('Tables & Tables basses'),
      n('Chaises/Tabourets/Bancs'),
      n('Lits/Matelas'),
      n('Rangements'),
      n('Meubles TV'),
      n('Meubles cuisine'),
      n('Meubles salle de bains'),
      n('Mobilier extérieur'),
      n('Luminaires'),
      n('Mobilier divers'),
    ]),
    n('Électroménager', [
      n('Gros électroménager'),
      n('Petit électroménager'),
    ]),
    n('Décoration & Linge', [
      n('Décoration'),
      n('Linge de maison'),
      n('Textiles de maison'),
      n('Arts de la table'),
    ]),
    n('Jardin & Plantes', [
      n('BBQ & Plancha'),
      n('Piscine & Accessoires'),
      n('Outils'),
      n('Plantes'),
    ]),
    n('Divers maison', [
      n('Papeterie & Fournitures scolaires'),
      n('Vaisselle & Ustensiles'),
    ]),
  ]),
  n('Bricolage & Outillage', [
    n('Électricité'),
    n('Plomberie'),
    n('Peinture & Revêtements'),
    n('Menuiserie & Bois'),
    n('Maçonnerie & Carrelage'),
    n('Isolation & Cloisons'),
    n('Quincaillerie & Fixations'),
    n('Outillage électroportatif'),
    n('Outillage à main'),
    n('Échelles & Échafaudages'),
    n('Rangement atelier'),
    n('Sécurité & EPI'),
    n('Divers'),
  ]),
  n('Famille & Puériculture', [
    n('Poussette/Landau/Siège auto'),
    n('Mobilier enfant'),
    n('Matelas & Linge de lit'),
    n('Accessoires'),
    n('Jeux'),
    n('Doudous & Peluches'),
  ]),
  n('Électronique & Multimédia', [
    n('Informatique', [
      n('Ordinateurs'),
      n('Tablettes'),
      n('Liseuses'),
      n('Accessoires informatique'),
    ]),
    n('Téléphonie', [
      n('Téléphones'),
      n('Accessoires téléphone'),
    ]),
    n('Montres & Objets connectés'),
    n('Image & Son', [
      n('TV & Vidéoprojecteurs'),
      n('Appareils photo & vidéo'),
      n('Enceintes'),
      n('Casques & Écouteurs'),
      n('Autre'),
    ]),
    n('Jeux vidéo', [
      n('Consoles'),
      n('Jeux vidéo'),
    ]),
  ]),
  n('Loisirs', [
    n('Pour enfants', [
      n('Jouets & Jeux'),
      n('Livres enfants'),
      n('Ateliers créatifs'),
      n('Musique'),
      n('Sport'),
    ]),
    n('Sport & Outdoor', [
      n('Sports nautiques & Aquatiques'),
      n('Skateboard/Trottinette/Roller'),
      n('Sports de raquette'),
      n('Sports collectifs'),
      n('Sports de combat & Arts martiaux'),
      n('Fitness & Musculation'),
      n('Camping'),
      n('Sports mécaniques'),
      n('Divers'),
    ]),
    n('Musique', [
      n('Instruments'),
      n('Accessoires'),
      n('CD/Vinyles'),
    ]),
    n('Lecture', [
      n('Livres'),
      n('Revues'),
      n('BD'),
    ]),
    n('Jeux de société'),
    n('Loisirs créatifs'),
    n('Modélisme'),
    n('Airsoft & Tir'),
  ]),
  n('Collections & Antiquités'),
  n('Animaux', [
    n('Chiens'),
    n('Chats'),
    n('Chevaux'),
    n('Rongeurs'),
    n('Animaux de ferme'),
    n('Adoption & Sauvetage'),
    n('Perdus & Trouvés'),
    n('Alimentation & Accessoires'),
    n('Reproduction & Saillies'),
    n('Autre'),
  ]),
  n('Services', [
    n('Travaux & Dépannages'),
    n('Jardinage/Piscine/Spa'),
    n('Ménage'),
    n('Déménagement & Livraison'),
    n('Services à la personne'),
    n("Garde d'enfants"),
    n('Soins à la personne'),
    n('Sports & Santé'),
    n('Mode/Beauté/Bien-être'),
    n('Administratif'),
    n('Cours particuliers'),
  ]),
  n('Matériel professionnel', [
    n('Agriculture & Espaces verts'),
    n('BTP & Industrie'),
    n('Restauration & Commerce'),
    n('Bureaux'),
    n('Médical'),
  ]),
  n('Divers'),
];
function assignIds(nodes, parentId = null, startId = 1, rows = [], path = []) {
  let nextId = startId;

  for (let position = 0; position < nodes.length; position += 1) {
    const node = nodes[position];
    const id = nextId;
    nextId += 1;
    const currentPath = [...path, node.name];

    rows.push({
      id,
      parent_id: parentId,
      name: node.name,
      slug: slugifyCategoryName(node.name),
      position,
      icon: inferCategoryIconKey(node.name, slugifyCategoryName(node.name), currentPath),
      children: [],
    });

    if (Array.isArray(node.children) && node.children.length > 0) {
      nextId = assignIds(node.children, id, nextId, rows, currentPath);
    }
  }

  return nextId;
}

function flattenCategoryTaxonomy() {
  const rows = [];
  assignIds(TAXONOMY_TREE, null, 1, rows);
  return rows;
}

function buildCategoryTreeFromFlatRows(rows = []) {
  const byId = new Map();
  const roots = [];

  for (const row of rows) {
    byId.set(Number(row.id), {
      id: Number(row.id),
      parent_id: row.parent_id == null ? null : Number(row.parent_id),
      name: row.name,
      slug: row.slug,
      icon: row.icon ?? null,
      position: Number(row.position ?? 0),
      children: [],
    });
  }

  for (const node of byId.values()) {
    if (node.parent_id && byId.has(node.parent_id)) {
      byId.get(node.parent_id).children.push(node);
    } else {
      roots.push(node);
    }
  }

  const sortNodes = (nodes) => {
    nodes.sort((a, b) => a.position - b.position || a.name.localeCompare(b.name, 'fr'));
    for (const node of nodes) {
      sortNodes(node.children);
      node.subcategories = node.children;
    }
    return nodes;
  };

  return sortNodes(roots);
}

function findCategoryNodeById(tree = [], id) {
  const targetId = Number(id)
  if (!Number.isFinite(targetId)) return null

  const stack = [...tree]
  while (stack.length > 0) {
    const current = stack.shift()
    if (!current) continue
    if (Number(current.id) === targetId) return current
    stack.unshift(...(current.children || current.subcategories || []))
  }
  return null
}

function findCategoryPathById(tree = [], id) {
  const targetId = Number(id)
  if (!Number.isFinite(targetId)) return []

  const visit = (nodes, trail = []) => {
    for (const node of nodes || []) {
      const currentTrail = [...trail, node]
      if (Number(node.id) === targetId) {
        return currentTrail
      }
      const found = visit(node.children || node.subcategories || [], currentTrail)
      if (found.length) return found
    }
    return []
  }

  return visit(tree, [])
}

module.exports = {
  TAXONOMY_TREE,
  slugifyCategoryName,
  flattenCategoryTaxonomy,
  buildCategoryTreeFromFlatRows,
  findCategoryNodeById,
  findCategoryPathById,
};

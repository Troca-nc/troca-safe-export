'use strict';

function withFallbackZone(zones = []) {
  const normalized = Array.from(
    new Set((Array.isArray(zones) ? zones : []).map((zone) => String(zone).trim()).filter(Boolean))
  );

  if (!normalized.includes('Autre / Non listé')) {
    normalized.push('Autre / Non listé');
  }

  return normalized;
}

const GEO_DATA = {
  'province-sud': {
    name: 'Province Sud',
    slug: 'province-sud',
    communes: [
      {
        name: 'Nouméa',
        slug: 'noumea',
        zones: withFallbackZone([
          'Receiving',
          'Vallée-du-Tir',
          'Magenta',
          'Rivière-Salée',
          'Kaméré',
          'Doniambo',
          'Motor Pool',
          'Faubourg Blanchot',
          'Artillerie',
          'Latin Quarter',
          'Baie-des-Citrons',
          'Anse-Vata',
          'Val-Plaisance',
          'Orphelinat',
          'Trianon',
          'Portes-de-Fer',
          'Tina',
          'Mont-Ravel',
          'Montravel',
          'Normandie',
          '7e km',
          'Numbo',
          'N\'Géa',
        ]),
      },
      {
        name: 'Dumbéa',
        slug: 'dumbea',
        zones: withFallbackZone([
          'Koutio',
          'Katiramona',
          'Dumbéa-sur-Mer',
          'Dumbéa-Village',
          'Gatope',
          'Auteuil',
          'Cognat',
          'Koé',
          'Boulari',
        ]),
      },
      {
        name: 'Mont-Dore',
        slug: 'mont-dore',
        zones: withFallbackZone([
          'Boulari',
          'La Coulée',
          'Plum',
          'Yahoué',
          'Mont-Dore centre',
          'Moindou',
          'Île-aux-Pins',
        ]),
      },
      {
        name: 'Païta',
        slug: 'paita',
        zones: withFallbackZone([
          'Tontouta',
          'La Tamoa',
          'Nassirah',
          'Saint-Louis',
          'Hameau du Col',
        ]),
      },
      {
        name: 'Boulouparis',
        slug: 'boulouparis',
        zones: withFallbackZone([
          'Boulouparis centre',
          'Haute-Coulée',
          'Dothio',
        ]),
      },
      {
        name: 'La Foa',
        slug: 'la-foa',
        zones: withFallbackZone([
          'La Foa centre',
          'Sarraméa',
          'Farino',
          'Moindou',
        ]),
      },
      {
        name: 'Bourail',
        slug: 'bourail',
        zones: withFallbackZone([
          'Bourail centre',
          'La Roche',
          'Téné',
          'Poya',
        ]),
      },
    ],
  },
  'province-nord': {
    name: 'Province Nord',
    slug: 'province-nord',
    communes: [
      {
        name: 'Koné',
        slug: 'kone',
        zones: withFallbackZone([
          'Koné centre',
          'Voh',
          'Kaala-Gomen',
          'Témala',
        ]),
      },
      {
        name: 'Koumac',
        slug: 'koumac',
        zones: withFallbackZone([
          'Koumac centre',
          'Ouégoa',
          'Pouébo',
          'Poum',
        ]),
      },
      {
        name: 'Poindimié',
        slug: 'poindimie',
        zones: withFallbackZone([
          'Poindimié centre',
          'Ponérihouen',
          'Houaïlou',
          'Canala',
          'Thio',
        ]),
      },
      {
        name: 'Touho',
        slug: 'touho',
        zones: withFallbackZone([
          'Touho centre',
          'Poindimié',
          'Hienghène',
        ]),
      },
      {
        name: 'Hienghène',
        slug: 'hienghene',
        zones: withFallbackZone([
          'Hienghène centre',
          'Pouébo',
          'Bondé',
        ]),
      },
      {
        name: 'Pouembout',
        slug: 'pouembout',
        zones: withFallbackZone([
          'Pouembout centre',
          'Poya',
          'Muéo',
        ]),
      },
    ],
  },
  'province-iles': {
    name: 'Province des Îles Loyauté',
    slug: 'province-iles',
    communes: [
      {
        name: 'Lifou',
        slug: 'lifou',
        zones: withFallbackZone([
          'Wé',
          'Chépénéhé',
          'Mu',
          'Drueulu',
          'Hnathalo',
          'Xepenehe',
        ]),
      },
      {
        name: 'Maré',
        slug: 'mare',
        zones: withFallbackZone([
          'Tadine',
          'La Roche',
          'Penelo',
          'Mebuet',
          'Kurin',
        ]),
      },
      {
        name: 'Ouvéa',
        slug: 'ouvea',
        zones: withFallbackZone([
          'Fayaoué',
          'Mouli',
          'Anawa',
          'Saint-Joseph',
          'Gossanah',
        ]),
      },
    ],
  },
};

function getProvinceBySlug(slug) {
  return GEO_DATA[String(slug || '').trim()] || null;
}

function getCommuneBySlug(communeSlug) {
  const normalized = String(communeSlug || '').trim().toLowerCase();
  if (!normalized) return null;

  for (const province of Object.values(GEO_DATA)) {
    const commune = province.communes.find((item) => item.slug === normalized);
    if (commune) {
      return { province, commune };
    }
  }

  return null;
}

function getZonesForCommune(communeSlug) {
  const match = getCommuneBySlug(communeSlug);
  return match?.commune?.zones ?? ['Autre / Non listé'];
}

module.exports = {
  GEO_DATA,
  getCommuneBySlug,
  getProvinceBySlug,
  getZonesForCommune,
};

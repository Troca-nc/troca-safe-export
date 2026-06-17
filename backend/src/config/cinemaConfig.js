'use strict';

const CINEMAS = [
  {
    id: 'koutio',
    name: 'Cinéma Koutio',
    commune: 'Dumbéa',
    address: 'Centre commercial Koutio, Dumbéa',
    website: 'https://www.cinemakoutio.nc',
    scrape_url: 'https://www.cinemakoutio.nc/seances',
    scrape_type: 'html',
    active: true,
  },
  {
    id: 'gaumont',
    name: 'Pathé Gaumont Nouméa',
    commune: 'Nouméa',
    address: 'Centre-ville, Nouméa',
    website: null,
    scrape_url: null,
    scrape_type: 'manual',
    active: false,
  },
];

module.exports = { CINEMAS };

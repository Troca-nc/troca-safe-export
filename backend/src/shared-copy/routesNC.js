// ⚠️ COPIE MANUELLE depuis /shared/routesNC.js
// Ne pas éditer séparément de l'original.
'use strict';

const ROUTES_NC = [
  {
    id: 'rt1-sud-nord',
    name: 'Route Territoriale 1 — Sud vers Nord',
    stops: [
      'Nouméa',
      'Dumbéa',
      'Païta',
      'Boulouparis',
      'La Foa',
      'Bourail',
      'Poya',
      'Pouembout',
      'Koné',
      'Voh',
      'Kaala-Gomen',
      'Koumac',
      'Poum',
    ],
  },
  {
    id: 'rt2-est',
    name: 'Route de la Côte Est',
    stops: [
      'Nouméa',
      'Thio',
      'Canala',
      'Houaïlou',
      'Ponérihouen',
      'Poindimié',
      'Touho',
      'Hienghène',
      'Pouébo',
      'Ouégoa',
      'Koumac',
    ],
  },
  {
    id: 'transversale-1',
    name: 'Transversale Col de Mouirange',
    stops: ['La Foa', 'Bourail', 'Canala', 'Thio'],
  },
  {
    id: 'transversale-2',
    name: 'Transversale Poya',
    stops: ['Poya', 'Houaïlou'],
  },
  {
    id: 'grand-noumea',
    name: 'Grand Nouméa',
    stops: ['Nouméa', 'Dumbéa', 'Païta', 'Mont-Dore'],
  },
  {
    id: 'tontouta',
    name: 'Axe Tontouta',
    stops: ['Nouméa', 'Dumbéa', 'Tontouta', 'Boulouparis'],
  },
];

function normalizeRouteText(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function findStopIndex(route, city) {
  if (!route || !city) return -1;
  const target = normalizeRouteText(city);
  return route.stops.findIndex((stop) => normalizeRouteText(stop) === target);
}

function findCommonRoute(departure, destination) {
  const dep = normalizeRouteText(departure);
  const dest = normalizeRouteText(destination);
  if (!dep || !dest) return null;

  for (const route of ROUTES_NC) {
    const departureIndex = route.stops.findIndex((stop) => normalizeRouteText(stop) === dep);
    const destinationIndex = route.stops.findIndex((stop) => normalizeRouteText(stop) === dest);
    if (departureIndex >= 0 && destinationIndex >= 0 && departureIndex < destinationIndex) {
      return {
        route,
        departureIndex,
        destinationIndex,
      };
    }
  }

  return null;
}

function isOnRoute(departure, destination, searchFrom, searchTo) {
  const candidateRoute = findCommonRoute(departure, destination);
  if (!candidateRoute) return false;

  const { route, departureIndex, destinationIndex } = candidateRoute;
  if (!searchFrom || !searchTo) return true;

  const searchFromIndex = findStopIndex(route, searchFrom);
  const searchToIndex = findStopIndex(route, searchTo);

  return (
    searchFromIndex >= 0
    && searchToIndex >= 0
    && searchFromIndex >= departureIndex
    && searchToIndex <= destinationIndex
  );
}

function getRouteStopsBetween(from, to) {
  const routeMatch = findCommonRoute(from, to);
  if (!routeMatch) return [];

  const { route, departureIndex, destinationIndex } = routeMatch;
  return route.stops.slice(departureIndex + 1, destinationIndex);
}

function getRouteCompatibility(departure, destination, searchFrom, searchTo) {
  const routeMatch = findCommonRoute(departure, destination);
  if (!routeMatch) {
    return {
      is_direct: false,
      via_stops: [],
      route_name: null,
      compatible: false,
    };
  }

  const { route } = routeMatch;
  const direct = normalizeRouteText(departure) === normalizeRouteText(searchFrom)
    && normalizeRouteText(destination) === normalizeRouteText(searchTo);
  const viaStops = searchFrom && searchTo
    ? getRouteStopsBetween(searchFrom, searchTo)
    : getRouteStopsBetween(departure, destination);

  return {
    is_direct: direct,
    via_stops: viaStops,
    route_name: route.name,
    compatible: searchFrom && searchTo ? isOnRoute(departure, destination, searchFrom, searchTo) : true,
  };
}

module.exports = {
  ROUTES_NC,
  normalizeRouteText,
  isOnRoute,
  getRouteStopsBetween,
  getRouteCompatibility,
};

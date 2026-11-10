/** Haversine distance in kilometers between two lat/lng points. */
export function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function formatDistanceKm(km: number): string {
  if (km < 0.1) return '50 m';
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}

/** Heuristic price suggestion from category + service keywords (rule-based "ML"). */
export function suggestServicePrice(
  category: string,
  service?: string,
): { suggested: string; min: number; max: number; confidence: number } {
  const key = `${category} ${service || ''}`.toLowerCase();

  const table: Array<{ match: RegExp; min: number; max: number }> = [
    { match: /engine|wiring|tank/, min: 800, max: 2500 },
    { match: /ac|refriger|cool/, min: 500, max: 1800 },
    { match: /install|fitting/, min: 300, max: 1200 },
    { match: /emergency|roadside/, min: 250, max: 900 },
    { match: /plumb|pipe|leak/, min: 150, max: 800 },
    { match: /electr|fan|switch/, min: 200, max: 900 },
    { match: /mechanic|service|oil/, min: 300, max: 1500 },
    { match: /clean|pest/, min: 400, max: 2000 },
    { match: /paint|carpenter/, min: 500, max: 3000 },
  ];

  const hit = table.find((row) => row.match.test(key));
  const min = hit?.min ?? 200;
  const max = hit?.max ?? 1000;
  const mid = Math.round((min + max) / 2 / 50) * 50;

  return {
    suggested: `₹${mid} onwards`,
    min,
    max,
    confidence: hit ? 0.82 : 0.55,
  };
}

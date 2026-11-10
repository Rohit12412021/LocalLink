/**
 * Single source of truth for service categories.
 * Keep in sync with frontend: src/data/categories.ts
 */
export const SERVICE_CATEGORIES = [
  'Mechanic',
  'Electrician',
  'Plumber',
  'Carpenter',
  'Car Repair',
  'AC Repair',
  'Cleaning',
  'Painting',
  'Mobile Repair',
  'Appliance Repair',
  'Pest Control',
  'Home Tutor',
  'Salon & Beauty',
  'Photography',
  'Other',
] as const;

export type ServiceCategory = (typeof SERVICE_CATEGORIES)[number];

/** Normalize for comparison */
export function normalizeCategory(cat: string): string {
  return cat.trim().toLowerCase().replace(/\s+/g, '-');
}

/** Validate — allows known categories OR any non-empty string (for 'Other' custom values) */
export function isValidCategory(cat: string): boolean {
  if (!cat?.trim()) return false;
  return true; // allow any non-empty category string
}

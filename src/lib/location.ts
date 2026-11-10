"use client";

/**
 * Detect browser geolocation once; falls back to Dharuhera coords.
 */
export function useUserLocation() {
  const fallback = { lat: 28.205, lng: 76.795, label: "Dharuhera, Haryana" };

  // lazy import pattern avoided — simple hook via state in consumers
  return fallback;
}

export function detectUserLocation(): Promise<{
  lat: number;
  lng: number;
  label: string;
}> {
  const fallback = { lat: 28.205, lng: 76.795, label: "Dharuhera, Haryana" };

  if (typeof window === "undefined" || !navigator.geolocation) {
    return Promise.resolve(fallback);
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          label: "Near you",
        });
      },
      () => resolve(fallback),
      { enableHighAccuracy: false, timeout: 6000, maximumAge: 120000 },
    );
  });
}

import { describe, it, expect } from 'vitest';
import { suggestServicePrice, haversineKm } from './geo.util';

describe('Geo & Price Utils', () => {
    it('suggestServicePrice returns sensible heuristic', () => {
        const res = suggestServicePrice('Mechanic', 'Engine repair');
        expect(res.min).toBe(800);
        expect(res.max).toBe(2500);
        expect(res.suggested).toMatch(/₹.* onwards/);
        expect(res.confidence).toBeGreaterThan(0.8);
    });

    it('suggestServicePrice returns fallback for unknown', () => {
        const res = suggestServicePrice('Unknown', 'Something');
        expect(res.min).toBe(200);
        expect(res.max).toBe(1000);
        expect(res.confidence).toBeLessThan(0.6);
    });

    it('haversineKm calculates distance correctly', () => {
        const d = haversineKm(28.205, 76.795, 28.206, 76.796);
        expect(d).toBeGreaterThan(0.1);
        expect(d).toBeLessThan(0.2);
    });
});

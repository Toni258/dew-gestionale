// Utility helpers for extract allergens.
import { ALLERGENS } from '../domain/allergens';

// Helper function used by extract allergen emojis.
export function extractAllergenEmojis(allergyNotes) {
    if (!allergyNotes) return [];

    const text = String(allergyNotes).toLowerCase();

    return ALLERGENS.filter((a) =>
        a.patterns.some((p) => text.includes(p)),
    ).map((a) => ({ icon: a.icon, label: a.label, key: a.key }));
}

export function hasDishChanged(original, current) {
    if (!original) return true;

    const normalize = (v) => {
        if (Array.isArray(v)) {
            return v.map((x) => x.trim()).join(', ');
        }
        if (v === null || v === undefined) return '';
        return String(v).trim();
    };

    const fields = [
        'name',
        'type',
        'grammage_tot',
        'kcal_tot',
        'proteins',
        'carbohydrates',
        'fats',
        'allergy_notes',
    ];

    return fields.some((field) => {
        const a = normalize(original[field]);
        const b = normalize(current[field]);
        return a !== b;
    });
}

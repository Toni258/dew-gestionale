// Small reusable validators shared by multiple forms.
// They intentionally stay lightweight and framework-agnostic.
export const isDecimal = (value) => {
    // Leave the "required" check to the caller.
    if (value === '' || value === null || value === undefined) return null;

    const normalized = String(value).trim();

    // Accepts: 10 | 10.5 | 0.25 | 20.123
    // Rejects: 10,5 | .5 | 5. | -1 | 1e3
    const decimalRegex = /^\d+(\.\d+)?$/;

    return decimalRegex.test(normalized)
        ? null
        : 'Deve essere un numero (usa il punto per i decimali, es. 20.5)';
};

// Helper function used by is positive.
export const isPositive = (value) => {
    if (value === '' || value === null || value === undefined) return null;
    return Number(value) < 0 ? 'Deve essere ≥ 0' : null;
};

// Validates the data used by macros vs grammage.
export const validateMacrosVsGrammage = (values) => {
    const grammage = Number(values.grammage_tot);
    const proteins = Number(values.proteins);
    const carbohydrates = Number(values.carbohydrates);
    const fats = Number(values.fats);

    // If one numeric field is still missing, let the field-level validators speak first.
    if ([grammage, proteins, carbohydrates, fats].some(Number.isNaN)) {
        return null;
    }

    const macrosSum = proteins + carbohydrates + fats;

    // Keep a 1g tolerance because macro data can be rounded.
    if (macrosSum > grammage + 1) {
        return {
            grammage_tot:
                'Proteine + carboidrati + grassi superano la grammatura',
        };
    }

    return null;
};
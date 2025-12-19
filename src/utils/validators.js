export const isDecimal = (v) => {
    // lascia che "required" venga gestito altrove
    if (v === '' || v === null || v === undefined) return null;

    const s = String(v).trim();

    // accetta: 10 | 10.5 | 0.25 | 20.123
    // rifiuta: 10,5 | .5 | 5. | -1 | 1e3 |  10
    const regex = /^\d+(\.\d+)?$/;

    return regex.test(s)
        ? null
        : 'Deve essere un numero (usa il punto per i decimali, es. 20.5)';
};

export const isPositive = (v) => {
    if (v === '' || v === null) return null;
    return Number(v) < 0 ? 'Deve essere ≥ 0' : null;
};

export const validateMacrosVsGrammage = (v) => {
    const g = Number(v.grammage_tot);
    const p = Number(v.proteins);
    const c = Number(v.carbohydrates);
    const f = Number(v.fats);

    // se mancano valori, non bloccare
    if ([g, p, c, f].some(isNaN)) return null;
    if (!g) return null;

    const sum = p + c + f;

    // tolleranza 1g
    if (sum > g + 1) {
        return {
            grammage_tot:
                'Proteine + carboidrati + grassi superano la grammatura',
        };
    }

    return null;
};

// Domain constants for allergens.
export const ALLERGENS = [
    { key: 'glutine', label: 'Glutine', emoji: '🌾', patterns: ['glutine'] },
    {
        key: 'latte',
        label: 'Latte / Lattosio',
        emoji: '🥛',
        patterns: ['latte', 'lattosio'],
    },
    { key: 'uova', label: 'Uova', emoji: '🥚', patterns: ['uova'] },
    { key: 'arachidi', label: 'Arachidi', emoji: '🥜', patterns: ['arachidi'] },
    {
        key: 'frutta_guscio',
        label: 'Frutta a guscio',
        emoji: '🌰',
        patterns: ['frutta a guscio', 'frutta secca'],
    },
    { key: 'pesce', label: 'Pesce', emoji: '🐟', patterns: ['pesce'] },
    {
        key: 'crostacei',
        label: 'Crostacei',
        emoji: '🦐',
        patterns: ['crostacei'],
    },
    {
        key: 'molluschi',
        label: 'Molluschi',
        emoji: '🦑',
        patterns: ['molluschi'],
    },
    { key: 'soia', label: 'Soia', emoji: '🌱', patterns: ['soia'] },
    { key: 'sedano', label: 'Sedano', emoji: '🥬', patterns: ['sedano'] },
    { key: 'senape', label: 'Senape', emoji: '🌿', patterns: ['senape'] },
    {
        key: 'sesamo',
        label: 'Semi di sesamo',
        emoji: '⚫',
        patterns: ['sesamo'],
    },
    {
        key: 'solfiti',
        label: 'Anidride solforosa e solfiti',
        emoji: '🍷',
        patterns: ['solfiti', 'anidride solforosa'],
    },
    { key: 'lupini', label: 'Lupini', emoji: '🌻', patterns: ['lupini'] },
];

// Helper function used by allergen options.
export const ALLERGEN_OPTIONS = [
    { value: 'Glutine', label: 'Glutine' },
    { value: 'Crostacei', label: 'Crostacei' },
    { value: 'Uova', label: 'Uova' },
    { value: 'Pesce', label: 'Pesce' },
    { value: 'Arachidi', label: 'Arachidi' },
    { value: 'Soia', label: 'Soia' },
    { value: 'Latte', label: 'Latte' },
    { value: 'Frutta a guscio', label: 'Frutta a guscio' },
    { value: 'Sedano', label: 'Sedano' },
    { value: 'Senape', label: 'Senape' },
    { value: 'Sesamo', label: 'Semi di sesamo' },
    {
        value: 'Anidride solforosa e solfiti',
        label: 'Anidride solforosa e solfiti',
    },
    { value: 'Lupini', label: 'Lupini' },
    { value: 'Molluschi', label: 'Molluschi' },
];
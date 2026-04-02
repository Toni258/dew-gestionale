// Domain constants for allergens.
export const ALLERGENS = [
    {
        key: 'glutine',
        label: 'Glutine',
        icon: 'gluten.png',
        patterns: ['glutine'],
    },
    {
        key: 'latte',
        label: 'Latte / Lattosio',
        icon: 'milk.png',
        patterns: ['latte', 'lattosio'],
    },
    { key: 'uova', label: 'Uova', icon: 'egg.png', patterns: ['uova'] },
    {
        key: 'arachidi',
        label: 'Arachidi',
        icon: 'peanut.png',
        patterns: ['arachidi'],
    },
    {
        key: 'frutta_guscio',
        label: 'Frutta a guscio',
        icon: 'hazelnut.png',
        patterns: ['frutta a guscio', 'frutta secca'],
    },
    { key: 'pesce', label: 'Pesce', icon: 'fish.png', patterns: ['pesce'] },
    {
        key: 'crostacei',
        label: 'Crostacei',
        icon: 'crab.png',
        patterns: ['crostacei'],
    },
    {
        key: 'molluschi',
        label: 'Molluschi',
        icon: 'octopus.png',
        patterns: ['molluschi'],
    },
    { key: 'soia', label: 'Soia', icon: 'soy.png', patterns: ['soia'] },
    {
        key: 'sedano',
        label: 'Sedano',
        icon: 'celery.png',
        patterns: ['sedano'],
    },
    {
        key: 'senape',
        label: 'Senape',
        icon: 'mustard.png',
        patterns: ['senape'],
    },
    {
        key: 'sesamo',
        label: 'Semi di sesamo',
        icon: 'sesame.png',
        patterns: ['sesamo'],
    },
    {
        key: 'solfiti',
        label: 'Anidride solforosa e solfiti',
        icon: 'wine.png',
        patterns: ['solfiti', 'anidride solforosa'],
    },
    { key: 'lupini', label: 'Lupini', icon: 'lupin.png', patterns: ['lupini'] },
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

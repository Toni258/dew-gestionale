// Shared helpers used by report pages to encode/decode menu selectors.
export function buildMenuValue(menu) {
    return `${menu.kind}:${menu.ref}`;
}

// Parses the value used by menu value.
export function parseMenuValue(value) {
    const [menuKind = '', ...rest] = String(value || '').split(':');
    return {
        menuKind,
        menuRef: rest.join(':'),
    };
}
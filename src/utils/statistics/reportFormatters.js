// Small formatter helpers shared by report pages.
export function fmtInt(value) {
    const numericValue = Number(value) || 0;
    return Math.round(numericValue).toLocaleString('it-IT');
}

// Helper function used by fmt dec.
export function fmtDec(value, digits = 2) {
    const numericValue = Number(value) || 0;
    return numericValue.toLocaleString('it-IT', {
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
    });
}

// Helper function used by fmt pct.
export function fmtPct(value, digits = 1) {
    const numericValue = Number(value) || 0;
    return `${numericValue.toLocaleString('it-IT', {
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
    })}%`;
}

// Formats the value used by date.
export function formatDate(value) {
    if (!value) return '';

    const date = new Date(value);
    return date.toLocaleDateString('it-IT', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });
}

// Formats the value used by date time.
export function formatDateTime(value) {
    if (!value) return '';

    const date = new Date(value);
    return date.toLocaleString('it-IT', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    });
}

// Formats the value used by course label.
export function formatCourseLabel(value) {
    if (value === 'ultimo') return 'Dessert';
    if (!value) return '';
    return String(value).charAt(0).toUpperCase() + String(value).slice(1);
}

// Formats the value used by chooser label.
export function formatChooserLabel(value) {
    if (value === 'guest') return 'Ospite';
    if (value === 'family') return 'Famiglia';
    if (value === 'caregiver') return 'Caregiver';
    return value || '';
}
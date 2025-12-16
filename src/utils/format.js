export function formatNumber(value, decimals = 2) {
    if (value === null || value === undefined || isNaN(value)) {
        return '0.00';
    }

    return Number(value).toFixed(decimals);
}

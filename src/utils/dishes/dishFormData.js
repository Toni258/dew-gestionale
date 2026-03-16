// Builds the FormData payload used by dish create/edit pages.
// The helper keeps the same mapping logic in one place.
const SUSPENSION_FORM_FIELDS = new Set([
    'suspension_enabled',
    'suspension_id',
    'start_date',
    'end_date',
    'reason',
]);

// Builds the data needed for dish form data.
export function buildDishFormData(
    values,
    { excludeSuspensionFields = false } = {},
) {
    const formData = new FormData();

    Object.entries(values).forEach(([key, value]) => {
        if (value === null || value === '') return;
        if (excludeSuspensionFields && SUSPENSION_FORM_FIELDS.has(key)) return;
        if (key === 'img' && typeof value === 'string') return;

        if (Array.isArray(value)) {
            value.forEach((item) => formData.append(`${key}[]`, item));
            return;
        }

        formData.append(key, value);
    });

    return formData;
}
// Shared validation helpers for dish create/edit forms.
// The goal is to keep page components small and keep the rules in one place.
import {
    isDecimal,
    isPositive,
    validateMacrosVsGrammage,
} from '../validators';

// Helper function used by is dish field empty.
export function isDishFieldEmpty(value) {
    return value === '' || value === null || value === undefined;
}

// Validates the data used by required number field.
function validateRequiredNumberField(value) {
    return isDishFieldEmpty(value)
        ? 'Obbligatorio'
        : isDecimal(value) || isPositive(value);
}

// Returns the data used by dish field validators.
export function getDishFieldValidators({ requireImage = false } = {}) {
    return {
        name: (value) =>
            !value
                ? 'Obbligatorio'
                : value.length < 3
                  ? 'Troppo corto'
                  : null,
        type: (value) => (!value ? 'Seleziona un tipo' : null),
        ...(requireImage
            ? {
                  img: (value) => (!value ? 'Carica un’immagine' : null),
              }
            : {}),
        grammage_tot: validateRequiredNumberField,
        kcal_tot: validateRequiredNumberField,
        proteins: validateRequiredNumberField,
        carbohydrates: validateRequiredNumberField,
        fats: validateRequiredNumberField,
    };
}

// Validates the data used by dish form.
export function validateDishForm(values, { includeSuspension = false } = {}) {
    const errors = validateMacrosVsGrammage(values) || {};

    if (includeSuspension && values.suspension_enabled) {
        if (!values.start_date) errors.start_date = 'Obbligatorio';
        if (!values.end_date) errors.end_date = 'Obbligatorio';

        if (
            values.start_date &&
            values.end_date &&
            values.end_date < values.start_date
        ) {
            errors.end_date = 'La data fine deve essere >= data inizio';
        }
    }

    return Object.keys(errors).length ? errors : null;
}
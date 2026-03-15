/**
 * User-related labels and select options shared by the management pages.
 */
export const BACKOFFICE_STATUS_LABELS = {
    active: 'Attivo',
    suspended: 'Sospeso',
    must_change_password: 'Password da cambiare',
    password_reset_requested: 'Reset password richiesto',
};

export const BACKOFFICE_ROLE_OPTIONS = [
    { value: '', label: '— Tutti —' },
    { value: 'super_user', label: 'Super User' },
    { value: 'operator', label: 'Operatore' },
];

export const BACKOFFICE_STATUS_OPTIONS = [
    { value: '', label: '— Tutti —' },
    { value: 'active', label: 'Attivo' },
    { value: 'password_reset_requested', label: 'Reset password richiesto' },
    { value: 'must_change_password', label: 'Password da cambiare' },
    { value: 'suspended', label: 'Sospeso' },
];

export const BACKOFFICE_MODAL_ROLE_OPTIONS = [
    { value: 'super_user', label: 'Super User' },
    { value: 'operator', label: 'Operatore' },
];

export const MOBILE_ROLE_LABELS = {
    Altro: 'Altro',
    altro: 'Altro',
    caregiver: 'Caregiver',
    super_user: 'Super User',
};

export const MOBILE_ROLE_OPTIONS = [
    { value: '', label: '— Ruolo —' },
    { value: 'super_user', label: 'Super User' },
    { value: 'caregiver', label: 'Caregiver' },
    { value: 'altro', label: 'Altro' },
];

export const MOBILE_MODAL_ROLE_OPTIONS = [
    { value: 'super_user', label: 'Super User' },
    { value: 'caregiver', label: 'Caregiver' },
    { value: 'Altro', label: 'Altro' },
];

export function getBackofficeStatusBadgeClass(status) {
    if (status === 'password_reset_requested') {
        return 'border-brand-error/25 bg-brand-error/10 text-brand-error';
    }

    if (status === 'suspended') {
        return 'border-brand-error/20 bg-brand-error/8 text-brand-error';
    }

    if (status === 'must_change_password') {
        return 'border-brand-warning/20 bg-brand-warning/10 text-brand-warning';
    }

    return 'border-brand-primary/20 bg-brand-primary/10 text-brand-primary';
}

import Button from '../ui/Button';
import { useFormContext } from '../ui/Form';
import { hasDishChanged } from '../../utils/diffDish';

function hasSuspensionChanged(initial, current) {
    if (!initial) return false;
    const enabledNow = !!current.suspension_enabled;
    if (enabledNow !== initial.enabled) return true;
    if (!enabledNow) return false;

    return (
        (current.start_date ?? '') !== (initial.valid_from ?? '') ||
        (current.end_date ?? '') !== (initial.valid_to ?? '') ||
        (current.reason ?? '') !== (initial.reason ?? '')
    );
}

export default function StickySaveBar({ originalDish, initialSuspension }) {
    const form = useFormContext();
    if (!form || !originalDish) return null;

    const dishChanged = hasDishChanged(originalDish, form.values);
    const suspensionChanged = hasSuspensionChanged(
        initialSuspension,
        form.values,
    );
    const imageChanged = form.values.img instanceof File;

    const changed = dishChanged || suspensionChanged || imageChanged;

    return (
        <div className="sticky bottom-0 z-30 -mx-6 mt-10 bg-white/95 backdrop-blur border-t border-brand-divider">
            <div className="py-4 flex justify-center">
                <Button type="submit" disabled={!changed} className="w-[240px]">
                    Salva modifiche
                </Button>
            </div>
        </div>
    );
}

// Sticky save bar used in the dish edit page.
// It shows the save button only when the form really changed.
import { useNavigate } from 'react-router-dom';

import Button from '../ui/Button';
import { useFormContext } from '../ui/Form';
import { hasDishChanged } from '../../utils/diffDish';
import { hasDishSuspensionChanged } from '../../utils/dishes/dishSuspension';

export default function StickySaveBar({ originalDish, initialSuspension }) {
    const form = useFormContext();
    const navigate = useNavigate();

    if (!form || !originalDish) return null;

    const dishChanged = hasDishChanged(originalDish, form.values);
    const suspensionChanged = hasDishSuspensionChanged(
        initialSuspension,
        form.values,
    );
    const imageChanged = form.values.img instanceof File;
    const changed = dishChanged || suspensionChanged || imageChanged;

    return (
        <div className="sticky bottom-0 z-30 -mx-6 mt-10 border-t border-brand-divider bg-white/95 backdrop-blur">
            <div className="flex justify-center gap-8 py-4">
                <Button
                    variant="secondary"
                    className="w-[240px]"
                    onClick={() => navigate('/dishes')}
                >
                    Indietro
                </Button>

                <Button type="submit" disabled={!changed} className="w-[240px]">
                    Salva modifiche
                </Button>
            </div>
        </div>
    );
}
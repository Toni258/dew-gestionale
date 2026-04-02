// Reusable button used to open the macronutrients legend modal.
import { useState } from 'react';
import MacronutrientsInfoModal from '../modals/MacronutrientsInfoModal';

export default function MacronutrientsInfoButton({
    ariaLabel = 'Legenda icone macronutrienti',
    iconSrc = '/icons/information blue.png',
    iconClassName = 'h-4 w-4',
    buttonClassName = 'inline-flex shrink-0 items-center justify-center transition hover:opacity-80',
}) {
    const [open, setOpen] = useState(false);

    return (
        <>
            <button
                type="button"
                onClick={() => setOpen(true)}
                aria-label={ariaLabel}
                className={buttonClassName}
            >
                <img
                    src={iconSrc}
                    alt={ariaLabel}
                    className={iconClassName}
                    draggable={false}
                />
            </button>

            <MacronutrientsInfoModal
                open={open}
                onClose={() => setOpen(false)}
            />
        </>
    );
}

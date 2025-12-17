import { useFormContext } from './Form';
import { ALLERGEN_OPTIONS } from '../../domain/allergens';

import Card from './Card';

export default function AllergenCheckboxGroup({ name, disabled = false }) {
    const form = useFormContext();

    if (!form) {
        throw new Error(
            'AllergenCheckboxGroup deve essere usato dentro <Form>'
        );
    }

    const selected = form.values[name] || [];

    const toggle = (value) => {
        if (disabled) return;

        const next = selected.includes(value)
            ? selected.filter((v) => v !== value)
            : [...selected, value];

        form.setFieldValue(name, next);
    };

    return (
        <div className="">
            {/* DA DECIDERE SE METTERE UN CONTORNO TIPO CARD: bg-brand-card rounded-20 shadow-card px-6 py-4 mt-2 */}

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-x-8 gap-y-3">
                {ALLERGEN_OPTIONS.map((a) => (
                    <label
                        key={a.value}
                        className={`
                        flex items-center gap-3 text-[15px]
                        cursor-pointer select-none hover:text-brand-primary
                        ${disabled ? 'opacity-60 cursor-not-allowed' : ''}
                    `}
                    >
                        <input
                            type="checkbox"
                            checked={selected.includes(a.value)}
                            onChange={() => toggle(a.value)}
                            disabled={disabled}
                            className="
                            w-6 h-6
                            rounded-md
                            border border-black
                            accent-brand-primary
                        "
                        />
                        <span>{a.label}</span>
                    </label>
                ))}
            </div>
        </div>
    );
}

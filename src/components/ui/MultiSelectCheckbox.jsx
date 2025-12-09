import { useState, useRef, useEffect } from 'react';
import { useFormContext } from './Form';

export default function MultiSelectCheckbox({
    name,
    options = [],
    placeholder = 'Seleziona...',
    className = '',
    height = 'h-[38px]',
}) {
    const form = useFormContext();
    const value = form?.values[name] ?? []; // array
    const error = form?.errors[name];

    const [open, setOpen] = useState(false);
    const wrapperRef = useRef(null);

    // ===============================
    // CHIUDI CLICK FUORI
    // ===============================
    useEffect(() => {
        const handler = (e) => {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // ===============================
    // HANDLER CHECK
    // ===============================
    const toggleValue = (v) => {
        let newVal;

        if (value.includes(v)) {
            newVal = value.filter((x) => x !== v);
        } else {
            newVal = [...value, v];
        }

        form?.setFieldValue(name, newVal);
    };

    // ===============================
    // TESTO NEL CAMPO
    // ===============================
    const count = value.length;

    let displayText = placeholder;
    if (count === 1) displayText = '1 allergene';
    if (count > 1) displayText = `${count} allergeni`;

    // ===============================
    // UI
    // ===============================
    const radius = open
        ? 'rounded-t-textField rounded-b-none'
        : 'rounded-textField';

    return (
        <div ref={wrapperRef} className={`flex flex-col ${className}`}>
            <div className={`relative ${height}`}>
                {/* BUTTON PRINCIPALE */}
                <button
                    type="button"
                    onClick={() => setOpen(!open)}
                    className={`
                        input-default w-full h-full text-left pr-10 
                        flex items-center justify-between
                        transition-all duration-300
                        ${error ? 'border-brand-error' : 'border-brand-divider'}
                        ${open ? 'shadow-ios-strong' : ''}
                        ${radius}
                    `}
                >
                    <span
                        className={`${
                            count === 0 ? 'text-brand-textSecondary' : ''
                        }`}
                    >
                        {displayText}
                    </span>

                    <img
                        src="/chevron-down-primary.png"
                        className={`
                            w-4 h-4 opacity-70 absolute right-3 top-1/2 -translate-y-1/2 
                            transition-transform duration-200
                            ${open ? 'rotate-180' : 'rotate-0'}
                        `}
                    />
                </button>

                {/* MENU CHECKBOX */}
                {open && (
                    <div
                        className="
                            absolute left-0 right-0 top-full z-50 
                            bg-white border border-brand-divider border-t-0 
                            rounded-b-textField shadow-ios-strong 
                            animate-fadeScale overflow-hidden
                        "
                    >
                        {options.map((opt, i) => {
                            const checked = value.includes(opt.value);
                            const isLast = i === options.length - 1;

                            return (
                                <label
                                    key={opt.value}
                                    className={`
                                        flex items-center gap-2 px-4 py-2 cursor-pointer
                                        select-none transition-all duration-150
                                        ${
                                            checked
                                                ? 'bg-brand-primary/10 font-semibold text-brand-primary'
                                                : 'hover:bg-black/5'
                                        }
                                        ${isLast ? 'rounded-b-textField' : ''}
                                    `}
                                >
                                    <input
                                        type="checkbox"
                                        className="w-4 h-4"
                                        checked={checked}
                                        onChange={() => toggleValue(opt.value)}
                                        onClick={(e) => e.stopPropagation()} // evita chiusura menu
                                    />
                                    {opt.label}
                                </label>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* ERRORE */}
            {error && (
                <span className="text-brand-error text-sm mt-1">{error}</span>
            )}
        </div>
    );
}

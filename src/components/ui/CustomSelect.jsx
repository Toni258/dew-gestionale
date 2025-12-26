import { useState, useRef, useEffect } from 'react';
import { useFormContext } from './Form';

export default function CustomSelect({
    name,
    options = [],
    placeholder = 'Seleziona...',
    loading = false,
    className = '',
    ...props
}) {
    const form = useFormContext();
    const selectedValue = form?.values[name] ?? '';
    const error = form?.errors[name];

    const [open, setOpen] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState(-1);

    const wrapperRef = useRef(null);
    const buttonRef = useRef(null);

    const isLoading = loading || options.length === 0;

    // ------------------------------------------------
    // Chiudi cliccando fuori
    // ------------------------------------------------
    useEffect(() => {
        const handler = (e) => {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
                setOpen(false);
                setHighlightedIndex(-1);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // ------------------------------------------------
    // Apertura: imposta highlightedIndex
    // ------------------------------------------------
    const openDropdown = () => {
        if (isLoading || options.length === 0) return;

        setOpen(true);

        if (selectedValue) {
            const idx = options.findIndex((o) => o.value === selectedValue);
            setHighlightedIndex(idx >= 0 ? idx : 0);
        } else {
            setHighlightedIndex(0);
        }
    };

    const closeDropdown = () => {
        setOpen(false);
        setHighlightedIndex(-1);
    };

    // ------------------------------------------------
    // Seleziona un valore
    // ------------------------------------------------
    const handleSelect = (value) => {
        form?.setFieldValue(name, value);
        closeDropdown();
    };

    // ------------------------------------------------
    // Gestione tastiera
    // ------------------------------------------------
    const handleKeyDown = (e) => {
        if (isLoading || options.length === 0) return;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                if (!open) {
                    openDropdown();
                    return;
                }
                setHighlightedIndex((prev) => {
                    const next = prev + 1;
                    return next >= options.length ? options.length - 1 : next;
                });
                break;

            case 'ArrowUp':
                e.preventDefault();
                if (!open) {
                    openDropdown();
                    return;
                }
                setHighlightedIndex((prev) => {
                    const next = prev - 1;
                    return next < 0 ? 0 : next;
                });
                break;

            case 'Enter':
            case ' ':
                e.preventDefault();
                if (!open) {
                    openDropdown();
                } else if (
                    highlightedIndex >= 0 &&
                    highlightedIndex < options.length
                ) {
                    handleSelect(options[highlightedIndex].value);
                }
                break;

            case 'Escape':
                e.preventDefault();
                if (open) {
                    closeDropdown();
                    buttonRef.current?.focus();
                }
                break;

            default:
                break;
        }
    };

    // ------------------------------------------------
    // Etichetta visualizzata
    // ------------------------------------------------
    const selectedLabel = selectedValue
        ? options.find((o) => o.value === selectedValue)?.label
        : null;

    // Classe base del bottone con radius che cambia se open
    const buttonRadiusClasses = open
        ? // sopra arrotondato, sotto dritto
          'rounded-t-textField rounded-b-none'
        : 'rounded-textField';

    return (
        <div className={`flex flex-col ${className}`} ref={wrapperRef}>
            <div className={`relative ${props.height || 'h-[38px]'}`}>
                {/* BUTTON PRINCIPALE */}
                <button
                    type="button"
                    ref={buttonRef}
                    onClick={() => (open ? closeDropdown() : openDropdown())}
                    onKeyDown={handleKeyDown}
                    className={`
                    input-default w-full h-full text-left flex items-center justify-between 
                    pr-10 transition-all duration-300 
                    ${error ? 'border-brand-error' : 'border-brand-divider'}
                    ${open ? 'shadow-ios-strong' : ''}
                    ${buttonRadiusClasses}
                `}
                    {...props}
                >
                    {/* Testo */}
                    <span
                        className={`${
                            !selectedLabel ? 'text-brand-textSecondary' : ''
                        }`}
                    >
                        {selectedLabel || placeholder}
                    </span>

                    {/* Freccia o Spinner */}
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                        {isLoading ? (
                            <div className="ios-spinner" />
                        ) : (
                            <img
                                src="/chevron-down-primary.png"
                                className={`w-4 h-4 opacity-70 transition-transform duration-200 ${
                                    open ? 'rotate-180' : 'rotate-0'
                                }`}
                            />
                        )}
                    </div>
                </button>

                {/* DROPDOWN */}
                {open && !isLoading && (
                    <div
                        className="
                        absolute left-0 right-0 top-full z-50 
                        bg-white border border-brand-divider border-t-0
                        rounded-b-textField rounded-t-none
                        shadow-ios-strong 
                        animate-fadeScale overflow-hidden
                    "
                    >
                        {options.map((opt, index) => {
                            const active = selectedValue === opt.value;
                            const highlighted = highlightedIndex === index;
                            const isLast = index === options.length - 1;

                            return (
                                <div
                                    key={opt.value}
                                    onClick={() => handleSelect(opt.value)}
                                    className={`
                                    px-4 py-2 cursor-pointer select-none
                                    transition-all duration-150
                                    ${
                                        highlighted
                                            ? 'bg-brand-primary/20 text-brand-primary font-semibold'
                                            : active
                                            ? 'bg-brand-primary/10 text-brand-primary font-semibold'
                                            : 'hover:bg-black/5'
                                    }
                                    ${isLast ? 'rounded-b-textField' : ''}
                                `}
                                >
                                    {opt.label}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

import { useEffect, useMemo, useRef, useState } from 'react';
import { useFormContext } from './Form';

export default function SearchableSelect({
    name,
    value,
    onChange,
    options = [],
    placeholder = 'Seleziona.',
    loading = false,
    disabled = false,
    className = '',
    height = 'h-[38px]',
    ...props
}) {
    const form = useFormContext();

    const isUsingForm = Boolean(form && name);
    const selectedValue = isUsingForm ? form.values?.[name] ?? '' : value ?? '';
    const error = isUsingForm ? form.errors?.[name] : null;

    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [highlightedIndex, setHighlightedIndex] = useState(-1);

    const wrapperRef = useRef(null);
    const buttonRef = useRef(null);
    const searchRef = useRef(null);
    const listRef = useRef(null);

    const isLoading = loading || options.length === 0;

    const selectedLabel = useMemo(() => {
        if (!selectedValue) return null;
        return options.find((o) => o.value === selectedValue)?.label ?? null;
    }, [selectedValue, options]);

    const filteredOptions = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return options;
        return options.filter((o) => String(o.label).toLowerCase().includes(q));
    }, [options, query]);

    const buttonRadiusClasses = open
        ? 'rounded-t-textField rounded-b-none'
        : 'rounded-textField';

    // -----------------------------
    // click outside
    // -----------------------------
    useEffect(() => {
        const handler = (e) => {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
                setOpen(false);
                setHighlightedIndex(-1);
                setQuery('');
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // -----------------------------
    // quando apro: set index + focus ricerca
    // -----------------------------
    useEffect(() => {
        if (!open) return;

        // imposta highlight su selected (se presente) oppure primo della lista filtrata
        const idxSelected = filteredOptions.findIndex(
            (o) => o.value === selectedValue
        );
        const next =
            idxSelected >= 0
                ? idxSelected
                : filteredOptions.length > 0
                ? 0
                : -1;
        setHighlightedIndex(next);

        // focus sul campo ricerca
        requestAnimationFrame(() => {
            searchRef.current?.focus();
            // seleziona testo per rendere veloce la ricerca
            searchRef.current?.select?.();
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    // -----------------------------
    // se cambia filtro: reset highlight in modo coerente
    // -----------------------------
    useEffect(() => {
        if (!open) return;
        if (filteredOptions.length === 0) {
            setHighlightedIndex(-1);
            return;
        }
        setHighlightedIndex((prev) => {
            if (prev < 0) return 0;
            if (prev >= filteredOptions.length)
                return filteredOptions.length - 1;
            return prev;
        });
    }, [query, filteredOptions.length, open]);

    // -----------------------------
    // scroll into view del highlighted
    // -----------------------------
    useEffect(() => {
        if (!open) return;
        if (!listRef.current) return;
        if (highlightedIndex < 0) return;

        const el = listRef.current.querySelector(
            `[data-ss-opt-index="${highlightedIndex}"]`
        );
        if (el?.scrollIntoView) {
            el.scrollIntoView({ block: 'nearest' });
        }
    }, [highlightedIndex, open]);

    const closeDropdown = () => {
        setOpen(false);
        setHighlightedIndex(-1);
        setQuery('');
    };

    const openDropdown = () => {
        if (disabled || isLoading || options.length === 0) return;
        setOpen(true);
    };

    const setValueInternal = (newValue) => {
        if (isUsingForm) {
            form.setFieldValue(name, newValue);
        } else {
            onChange?.(newValue);
        }
    };

    const handleSelect = (newValue) => {
        setValueInternal(newValue);
        closeDropdown();
        // riportiamo il focus sul bottone (accessibilità)
        requestAnimationFrame(() => buttonRef.current?.focus());
    };

    // -----------------------------
    // Tastiera: gestiamo sia sul bottone sia nel dropdown
    // -----------------------------
    const handleKeyDown = (e) => {
        if (disabled) return;
        if (isLoading || options.length === 0) return;

        // se chiuso, Enter/Space/Arrow apre
        if (!open) {
            if (
                e.key === 'Enter' ||
                e.key === ' ' ||
                e.key === 'ArrowDown' ||
                e.key === 'ArrowUp'
            ) {
                e.preventDefault();
                openDropdown();
            }
            return;
        }

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setHighlightedIndex((prev) => {
                    const next = prev + 1;
                    return next >= filteredOptions.length
                        ? filteredOptions.length - 1
                        : next;
                });
                break;

            case 'ArrowUp':
                e.preventDefault();
                setHighlightedIndex((prev) => {
                    const next = prev - 1;
                    return next < 0 ? 0 : next;
                });
                break;

            case 'Enter':
                e.preventDefault();
                if (
                    highlightedIndex >= 0 &&
                    highlightedIndex < filteredOptions.length
                ) {
                    handleSelect(filteredOptions[highlightedIndex].value);
                }
                break;

            case 'Escape':
                e.preventDefault();
                closeDropdown();
                requestAnimationFrame(() => buttonRef.current?.focus());
                break;

            default:
                break;
        }
    };

    const disabledFinal = disabled || isLoading;

    return (
        <div className={`flex flex-col ${className}`} ref={wrapperRef}>
            <div className={`relative ${height}`}>
                {/* BUTTON PRINCIPALE */}
                <button
                    type="button"
                    ref={buttonRef}
                    onClick={() => (open ? closeDropdown() : openDropdown())}
                    onKeyDown={handleKeyDown}
                    className={`
                        input-default w-full h-full text-left flex items-center justify-between
                        pr-10 transition-all duration-300
                        ${
                            disabledFinal
                                ? 'opacity-60 cursor-not-allowed'
                                : 'cursor-pointer'
                        }
                        ${error ? 'border-brand-error' : 'border-brand-divider'}
                        ${open ? 'shadow-ios-strong' : ''}
                        ${buttonRadiusClasses}
                    `}
                    aria-haspopup="listbox"
                    aria-expanded={open}
                    disabled={disabledFinal}
                    {...props}
                >
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
                                alt=""
                                className={`w-4 h-4 opacity-70 transition-transform duration-200 ${
                                    open ? 'rotate-180' : 'rotate-0'
                                }`}
                                draggable={false}
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
                        onKeyDown={handleKeyDown}
                    >
                        {/* SEARCH */}
                        <div className="p-2 border-b border-brand-divider bg-white">
                            <div className="relative">
                                <input
                                    ref={searchRef}
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder="Cerca..."
                                    className="
                                        input-default w-full
                                        rounded-textField
                                        pr-9
                                    "
                                />
                                {query && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setQuery('');
                                            requestAnimationFrame(() =>
                                                searchRef.current?.focus()
                                            );
                                        }}
                                        className="
                                            absolute right-2 top-1/2 -translate-y-1/2
                                            text-brand-textSecondary hover:text-brand-text
                                            transition-colors
                                        "
                                        aria-label="Svuota ricerca"
                                    >
                                        ✕
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* LISTA OPZIONI */}
                        <div
                            ref={listRef}
                            role="listbox"
                            className="max-h-64 overflow-auto"
                        >
                            {filteredOptions.length === 0 ? (
                                <div className="px-4 py-3 text-brand-textSecondary select-none">
                                    Nessun risultato
                                </div>
                            ) : (
                                filteredOptions.map((opt, index) => {
                                    const active = selectedValue === opt.value;
                                    const highlighted =
                                        highlightedIndex === index;
                                    const isLast =
                                        index === filteredOptions.length - 1;

                                    return (
                                        <div
                                            key={opt.value}
                                            role="option"
                                            aria-selected={active}
                                            data-ss-opt-index={index}
                                            onMouseEnter={() =>
                                                setHighlightedIndex(index)
                                            }
                                            onMouseDown={(e) => {
                                                // evita blur/focus jump prima del click
                                                e.preventDefault();
                                            }}
                                            onClick={() =>
                                                handleSelect(opt.value)
                                            }
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
                                                ${
                                                    isLast
                                                        ? 'rounded-b-textField'
                                                        : ''
                                                }
                                            `}
                                        >
                                            {opt.label}
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

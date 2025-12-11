import { useState } from 'react';

export default function SearchInput({
    placeholder = 'Cerca...',
    initialValue = '',
    onSearch,
    className = '',
}) {
    const [value, setValue] = useState(initialValue);

    const handleSubmit = (e) => {
        e.preventDefault(); // non ricaricare la pagina
        const query = value.trim();
        if (onSearch) onSearch(query);
    };

    return (
        <form
            onSubmit={handleSubmit}
            className={`relative ${className}`}
            // così Enter scatena SOLO questa ricerca
        >
            {/* Icona lente */}
            <span className="absolute left-4 top-1/2 -translate-y-1/2 opacity-70 pointer-events-none text-base">
                🔍
            </span>

            {/* Input */}
            <input
                type="search"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="
                    input-default h-[45px] w-full pl-11 pr-10
                "
                placeholder={placeholder}
            />

            {/* (Opzionale) tasto clear rapido */}
            {value && (
                <button
                    type="button"
                    onClick={() => {
                        setValue('');
                        if (onSearch) onSearch(''); // reset filtro
                    }}
                    className="
                        absolute right-5 top-1/2 -translate-y-1/2
                        text-sm text-brand-textSecondary hover:text-brand-text
                    "
                >
                    ✕
                </button>
            )}
        </form>
    );
}

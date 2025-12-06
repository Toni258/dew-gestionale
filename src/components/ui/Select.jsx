import { useFormContext } from './Form';

export default function Select({
    name,
    className = '',
    options = [],
    ...props
}) {
    const form = useFormContext();

    // Fallback se non c'è form
    if (!form || !name) {
        return (
            <select
                className={`input-default cursor-pointer 
                    appearance-none bg-[url('/chevron-down-primary.png')] 
                    bg-no-repeat bg-[length:16px_16px]
                    bg-[position:calc(100%-12px)_center] pr-10 ${className}`}
                {...props}
            >
                {options.map((o) => (
                    <option key={o.value} value={o.value}>
                        {o.label}
                    </option>
                ))}
            </select>
        );
    }

    const field = form.registerField(name);
    const showError = form.touched[name] || form.submitting;
    const error = showError ? form.errors[name] : null;
    const loading = form.asyncLoading?.[name];

    return (
        <div className={`relative flex flex-col ${className}`}>
            <select
                {...field}
                {...props}
                className={`input-default cursor-pointer 
                    appearance-none bg-[url('/chevron-down-primary.png')] 
                    bg-no-repeat bg-[length:16px_16px]
                    bg-[position:calc(100%-12px)_center] 
                    pr-10 ${
                        error ? 'border-brand-error' : 'border-brand-divider'
                    }`}
            >
                {options.map((o) => (
                    <option key={o.value} value={o.value}>
                        {o.label}
                    </option>
                ))}
            </select>

            {/* Spinner async */}
            {loading && (
                <span
                    className="pointer-events-none absolute right-8 top-1/2 -translate-y-1/2
                               w-4 h-4 border-2 border-brand-primary border-t-transparent 
                               rounded-full animate-spin"
                />
            )}

            {error && (
                <span className="text-brand-error text-sm mt-1 animate-fadeIn">
                    {error}
                </span>
            )}
        </div>
    );
}

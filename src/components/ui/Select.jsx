import { useFormContext } from './Form';

export default function Select({
    name,
    className = '',
    options = [],
    ...props
}) {
    const form = useFormContext();

    // Fallback se non c'è un form
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

    return (
        <div className={`flex flex-col ${className}`}>
            <select
                {...field}
                {...props}
                className={`input-default cursor-pointer 
                    appearance-none bg-[url('/chevron-down-primary.png')] 
                    bg-no-repeat bg-[length:16px_16px]
                    bg-[position:calc(100%-12px)_center] pr-10
                    ${error ? 'border-brand-error' : 'border-brand-divider'}`}
            >
                {options.map((o) => (
                    <option key={o.value} value={o.value}>
                        {o.label}
                    </option>
                ))}
            </select>

            {error && (
                <span className="text-brand-error text-sm mt-1 animate-fadeIn">
                    {error}
                </span>
            )}
        </div>
    );
}

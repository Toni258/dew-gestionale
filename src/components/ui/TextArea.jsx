import { useFormContext } from './Form';

export default function TextArea({ name, className = '', rows = 4, ...props }) {
    const form = useFormContext();

    if (!form || !name) {
        return (
            <textarea
                rows={rows}
                className={`input-default resize-none ${className}`}
                {...props}
            />
        );
    }

    const field = form.registerField(name);
    const showError = form.touched[name] || form.submitting;
    const error = showError ? form.errors[name] : null;
    const loading = form.asyncLoading?.[name];

    return (
        <div className={`relative flex flex-col ${className}`}>
            <textarea
                {...field}
                {...props}
                rows={rows}
                className={`input-default resize-none pr-8 ${
                    error ? 'border-brand-error' : 'border-brand-divider'
                }`}
            />

            {/* Spinner async in alto a destra */}
            {loading && (
                <span
                    className="pointer-events-none absolute right-2 top-2
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

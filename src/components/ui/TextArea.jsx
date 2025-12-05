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

    return (
        <div className={`flex flex-col ${className}`}>
            <textarea
                {...field}
                {...props}
                rows={rows}
                className={`input-default resize-none ${
                    error ? 'border-brand-error' : 'border-brand-divider'
                }`}
            />

            {error && (
                <span className="text-brand-error text-sm mt-1 animate-fadeIn">
                    {error}
                </span>
            )}
        </div>
    );
}

import { useFormContext } from './Form';

export default function FormGroup({
    label,
    required = false,
    helperText = '',
    name,
    children,
    className = '',
    labelClassName = '',
}) {
    const form = useFormContext();

    let error = null;
    if (form && name) {
        const showError = form.touched[name] || form.submitting;
        error = showError ? form.errors[name] : null;
    }

    return (
        <div className={`flex flex-col gap-1 ${className}`}>
            {label && (
                <label
                    className={`
                        text-sm font-semibold text-brand-text
                        ${labelClassName}
                    `}
                >
                    {label}
                    {required && (
                        <span className="text-brand-error ml-1">*</span>
                    )}
                </label>
            )}

            {children}

            {!error && helperText && (
                <p className="text-sm text-brand-textSecondary ">
                    {helperText}
                </p>
            )}

            {error && (
                <p className="text-sm text-brand-error animate-fadeIn">
                    {error}
                </p>
            )}
        </div>
    );
}

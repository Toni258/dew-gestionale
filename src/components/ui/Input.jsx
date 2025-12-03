export default function Input({
    label,
    value,
    onChange,
    placeholder = '',
    type = 'text',
    className = '',
    error = '',
    ...props
}) {
    return (
        <div className={`flex flex-col ${className}`}>
            {/* LABEL */}
            {label && (
                <label className="text-sm font-medium text-brand-text mb-1">
                    {label}
                </label>
            )}

            {/* INPUT FIELD */}
            <input
                type={type}
                value={value}
                onChange={(e) => onChange && onChange(e.target.value)}
                placeholder={placeholder}
                className={`input-default ${
                    error ? 'border-brand-error' : 'border-brand-divider'
                }`}
                {...props}
            />

            {/* ERROR MESSAGE */}
            {error && (
                <span className="text-brand-error text-sm mt-1">{error}</span>
            )}
        </div>
    );
}

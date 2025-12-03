export default function Button({
    children,
    variant = 'primary',
    size = 'md',
    className = '',
    disabled = false,
    onClick,
    type = 'button',
}) {
    const base = 'btn';
    const variantClass = `btn-${variant}`;
    const sizeClass = `btn-${size}`;

    return (
        <button
            type={type}
            disabled={disabled}
            onClick={onClick}
            className={`${base} ${variantClass} ${sizeClass} ${className}`}
        >
            {children}
        </button>
    );
}

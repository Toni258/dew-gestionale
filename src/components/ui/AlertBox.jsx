const VARIANT_STYLES = {
    info: {
        bg: 'bg-brand-secondary/10',
        border: 'border-brand-secondary/50',
        icon: '/information blue.png',
        alt: 'Informazione',
    },
    warning: {
        bg: 'bg-brand-warning/10',
        border: 'border-brand-warning/50',
        icon: '/warning giallo.png',
        alt: 'Avviso',
    },
    error: {
        bg: 'bg-brand-error/10',
        border: 'border-brand-error/50',
        icon: '/warning rosso.png',
        alt: 'Errore',
    },
};

export default function AlertBox({
    variant = 'info',
    title,
    children,
    className = '',
}) {
    const styles = VARIANT_STYLES[variant] || VARIANT_STYLES.info;

    return (
        <div
            className={`
                ${styles.bg}
                ${styles.border}
                border
                p-4
                rounded-lg
                ${className}
            `}
        >
            <div className="flex gap-2">
                <img
                    src={styles.icon}
                    className="w-4 h-4 mt-1 select-none"
                    alt={styles.alt}
                />

                <div className="flex flex-col">
                    <span className="text-brand-text text-md font-semibold">
                        {title}
                    </span>

                    <span className="text-brand-text text-sm font-normal">
                        {children}
                    </span>
                </div>
            </div>
        </div>
    );
}

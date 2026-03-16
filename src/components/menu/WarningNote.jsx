// Warning note.
export default function WarningNote({
    children,
    iconSrc = '/icons/warning giallo.png',
}) {
    return (
        <div className="flex items-center gap-4">
            <img src={iconSrc} className="w-5 h-5" alt="Avvertenza" />
            <h2 className="text-brand-textSecondary">{children}</h2>
        </div>
    );
}

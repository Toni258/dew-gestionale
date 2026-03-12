export default function Modal({
    children,
    onClose,
    contentClassName = '',
    closeOnBackdrop = true,
}) {
    function handleBackdropClick() {
        if (!closeOnBackdrop) return;
        onClose?.();
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-[6px]"
            onClick={handleBackdropClick}
        >
            <div
                className={`modal-animation ${contentClassName}`}
                onClick={(e) => e.stopPropagation()}
            >
                {children}
            </div>
        </div>
    );
}

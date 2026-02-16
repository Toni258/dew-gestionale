export default function Modal({ children, onClose, contentClassName = '' }) {
    return (
        <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm 
                       flex items-center justify-center z-50"
            onClick={onClose}
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

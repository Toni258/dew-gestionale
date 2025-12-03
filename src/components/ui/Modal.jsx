export default function Modal({ children, onClose }) {
    return (
        <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm 
                       flex items-center justify-center z-50"
            onClick={onClose}
        >
            <div
                className="modal-animation"
                onClick={(e) => e.stopPropagation()}
            >
                {children}
            </div>
        </div>
    );
}

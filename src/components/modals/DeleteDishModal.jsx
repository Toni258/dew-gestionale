import Modal from '../ui/Modal';

export default function DeleteDishModal({ dish, onClose, onConfirm }) {
    if (!dish) return null;

    return (
        <Modal onClose={onClose}>
            <div className="bg-white rounded-xl p-8 w-[500px] flex flex-col items-center text-center">
                <h2 className="text-brand-text text-xl font-semibold mb-2">
                    Conferma eliminazione
                </h2>

                <p className="text-brand-primary text-lg font-bold mb-4">
                    {dish.name}
                </p>

                <p className="text-brand-textSecondary text-sm mb-8 leading-relaxed">
                    Questo piatto verrà eliminato definitivamente.
                    <br />
                    L’operazione <strong>non può essere annullata</strong>.
                </p>

                <div className="flex justify-center gap-8">
                    <button
                        type="button"
                        onClick={onClose}
                        className="bg-brand-sidebar text-black px-6 py-2 rounded-xl hover:opacity-70 transition font-semibold"
                    >
                        Annulla
                    </button>

                    <button
                        type="button"
                        onClick={() => onConfirm(dish)}
                        className="bg-red-600 text-white font-semibold px-6 py-2 rounded-xl hover:opacity-70 transition"
                    >
                        Elimina
                    </button>
                </div>
            </div>
        </Modal>
    );
}

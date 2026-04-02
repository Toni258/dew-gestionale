// Info macro.
export default function InfoMacro({ food }) {
    if (!food) {
        return (
            <div className="mt-4 pl-4 text-brand-textSecondary italic opacity-70">
                Nessun piatto selezionato
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-y-2 mt-4 pl-4">
            <div className="flex">
                <span className="w-1/3">
                    Peso: {Number(food.grammage_tot || 0).toFixed(2)} g
                </span>
                <span className="w-1/3">
                    Energia: {Number(food.kcal_tot || 0).toFixed(2)} kcal
                </span>
            </div>
            <div className="flex">
                <span className="w-1/3 flex items-center">
                    <img
                        src="/icons/steak.png"
                        alt="Proteine"
                        title="Proteine"
                        className="h-5 w-5 mr-1 cursor-help select-none"
                        draggable={false}
                    />{' '}
                    {Number(food.proteins || 0).toFixed(2)} g
                </span>
                <span className="w-1/3 flex items-center">
                    <img
                        src="/icons/bread.png"
                        alt="Carboidrati"
                        title="Carboidrati"
                        className="h-5 w-5 mr-1 cursor-help select-none"
                        draggable={false}
                    />{' '}
                    {Number(food.carbs || 0).toFixed(2)} g
                </span>
                <span className="w-1/3 flex items-center">
                    <img
                        src="/icons/butter.png"
                        alt="Grassi"
                        title="Grassi"
                        className="h-5 w-5 mr-1 cursor-help select-none"
                        draggable={false}
                    />{' '}
                    {Number(food.fats || 0).toFixed(2)} g
                </span>

                {/* Alternative senza icone:
                <span className="w-1/3">
                    Proteine: {Number(food.proteins || 0).toFixed(2)} g
                </span>
                <span className="w-1/3">
                    Carboidrati: {Number(food.carbs || 0).toFixed(2)} g
                </span>
                <span className="w-1/3">
                    Grassi: {Number(food.fats || 0).toFixed(2)} g
                </span>
                */}
            </div>
        </div>
    );
}

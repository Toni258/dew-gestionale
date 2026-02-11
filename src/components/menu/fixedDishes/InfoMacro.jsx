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
                <span className="w-1/3">
                    Proteine: {Number(food.proteins || 0).toFixed(2)} g
                </span>
                <span className="w-1/3">
                    Carboidrati: {Number(food.carbs || 0).toFixed(2)} g
                </span>
                <span className="w-1/3">
                    Grassi: {Number(food.fats || 0).toFixed(2)} g
                </span>
            </div>
        </div>
    );
}

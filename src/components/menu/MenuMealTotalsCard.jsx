// Card component used for menu meal totals.
import Card from '../ui/Card';
import MacronutrientsInfoButton from '../ui/MacronutrientsInfoButton';

export default function MenuMealTotalsCard({ totals }) {
    return (
        <>
            <div className="mt-3 mb-1 h-px w-full bg-[repeating-linear-gradient(to_right,#C6C6C6_0,#C6C6C6_6px,transparent_6px,transparent_12px)]" />

            <span className="text-lg font-semibold">
                Valori nutrizionali complessivi del pasto
            </span>

            <Card className="!p-3 rounded-xl mt-[-10px]">
                <div className="flex justify-between items-center text-md text-brand-textSecondary flex mx-10">
                    <span>
                        <strong>Peso:</strong> {totals.weight.toFixed(2)}g
                    </span>
                    <span>
                        <strong>Kcal:</strong> {totals.kcal.toFixed(2)}
                    </span>
                    <span className="flex flex-wrap items-center gap-4">
                        <span className="flex items-center gap-2">
                            <MacronutrientsInfoButton />
                            <strong>Macro nutrienti:</strong>
                        </span>

                        <span className="flex items-center">
                            <img
                                src="/icons/steak.png"
                                alt="Proteine"
                                title="Proteine"
                                className="mr-1 h-5 w-5 cursor-help select-none"
                                draggable={false}
                            />
                            {totals.proteins.toFixed(2)}g
                        </span>

                        <span className="flex items-center">
                            <img
                                src="/icons/bread.png"
                                alt="Carboidrati"
                                title="Carboidrati"
                                className="mr-1 h-5 w-5 cursor-help select-none"
                                draggable={false}
                            />
                            {totals.carbs.toFixed(2)}g
                        </span>

                        <span className="flex items-center">
                            <img
                                src="/icons/butter.png"
                                alt="Grassi"
                                title="Grassi"
                                className="mr-1 h-5 w-5 cursor-help select-none"
                                draggable={false}
                            />
                            {totals.fats.toFixed(2)}g
                        </span>
                    </span>
                </div>
            </Card>
        </>
    );
}

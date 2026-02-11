import Card from '../ui/Card';

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
                    <span className="flex gap-4">
                        <strong>Macro nutrienti:</strong>
                        <span>🥩 {totals.proteins.toFixed(2)}g |</span>
                        <span>🍞 {totals.carbs.toFixed(2)}g |</span>
                        <span>🧈 {totals.fats.toFixed(2)}g</span>
                    </span>
                </div>
            </Card>
        </>
    );
}

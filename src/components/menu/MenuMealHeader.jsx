import { capitalize } from '../../utils/capitalize';

export default function MenuMealHeader({
    pageLabel,
    giorno,
    settimana,
    mealType,
}) {
    return (
        <div className="flex items-center">
            <h1 className="flex-[1] text-3xl font-semibold">{pageLabel}</h1>

            <div className="flex gap-20 text-xl mt-2">
                <div className="flex gap-2">
                    <span>Giorno:</span>
                    <span className="text-brand-primary font-bold">
                        {Number(giorno)}
                    </span>
                </div>

                <div className="flex gap-2">
                    <span>Settimana:</span>
                    <span className="text-brand-primary font-bold">
                        {Number(settimana)}
                    </span>
                </div>

                <div className="flex gap-2">
                    <span>Pasto:</span>
                    <span className="text-brand-primary font-bold">
                        {capitalize(mealType)}
                    </span>
                </div>
            </div>
        </div>
    );
}

import FormGroup from '../ui/FormGroup';
import SearchableSelect from '../ui/SearchableSelect';

function MacroBox({ food }) {
    return (
        <div className="flex-[2] text-md text-brand-textSecondary flex flex-col gap-1 justify-center">
            {food ? (
                <>
                    <div>
                        <strong>Peso:</strong>{' '}
                        {Number(food.grammage_tot).toFixed(2)} g
                    </div>
                    <div>
                        <strong>Kcal:</strong>{' '}
                        {Number(food.kcal_tot).toFixed(2)}
                    </div>
                    <div>
                        <strong>Macro nutrienti:</strong> 🥩{' '}
                        {Number(food.proteins).toFixed(2)} | 🍞{' '}
                        {Number(food.carbs).toFixed(2)} | 🧈{' '}
                        {Number(food.fats).toFixed(2)}
                    </div>
                </>
            ) : (
                <span className="italic opacity-60 mt-5">
                    Nessun piatto selezionato
                </span>
            )}
        </div>
    );
}

export default function MenuMealCourseRow({
    course,
    valueId,
    options,
    onChange,
    selectedFood,
    showDivider,
}) {
    return (
        <div>
            <div className="flex gap-20">
                <FormGroup label={course.label} className="flex flex-[3]">
                    <SearchableSelect
                        placeholder={`Seleziona ${course.label.toLowerCase()}`}
                        value={String(valueId ?? '')}
                        options={(options ?? []).map((f) => ({
                            value: String(f.id_food),
                            label: f.name,
                        }))}
                        onChange={onChange}
                    />
                </FormGroup>

                <MacroBox food={selectedFood} />
            </div>

            {showDivider && (
                <div className="border-t border-dashed border-brand-divider mt-6" />
            )}
        </div>
    );
}

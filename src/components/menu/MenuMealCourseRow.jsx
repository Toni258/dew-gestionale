// Menu meal course row.
import FormGroup from '../ui/FormGroup';
import SearchableSelect from '../ui/SearchableSelect';

// Component used for menu meal course row.
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
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                            <strong>Macro nutrienti:</strong>
                        </div>

                        <span className="flex flex-wrap items-center">
                            <img
                                src="/icons/steak.png"
                                alt="Proteine"
                                title="Proteine"
                                className="mr-1 h-5 w-5 cursor-help select-none"
                                draggable={false}
                            />
                            {Number(food.proteins).toFixed(2)}
                        </span>

                        <span className="flex items-center">
                            <img
                                src="/icons/bread.png"
                                alt="Carboidrati"
                                title="Carboidrati"
                                className="mr-1 h-5 w-5 cursor-help select-none"
                                draggable={false}
                            />
                            {Number(food.carbs).toFixed(2)}
                        </span>

                        <span className="flex items-center">
                            <img
                                src="/icons/butter.png"
                                alt="Grassi"
                                title="Grassi"
                                className="mr-1 h-5 w-5 cursor-help select-none"
                                draggable={false}
                            />
                            {Number(food.fats).toFixed(2)}
                        </span>
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

// Component used for menu meal course row.
function ReadOnlyFoodBox({ food, placeholder }) {
    return (
        <div className="input-default w-full flex items-center h-[38px] rounded-textField border border-brand-divider bg-white/60 px-3">
            <span
                className={
                    food ? '' : 'text-brand-textSecondary italic opacity-70'
                }
            >
                {food?.name ?? placeholder}
            </span>
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
    readOnly = false,
}) {
    return (
        <div>
            <div className="flex gap-20">
                <FormGroup label={course.label} className="flex flex-[2]">
                    {readOnly ? (
                        <div className="input-default w-full h-[38px] flex items-center px-4 rounded-textField border border-brand-divider bg-white/60">
                            <span
                                className={
                                    selectedFood
                                        ? ''
                                        : 'text-brand-textSecondary italic opacity-70'
                                }
                            >
                                {selectedFood?.name ??
                                    'Nessun piatto selezionato'}
                            </span>
                        </div>
                    ) : (
                        <SearchableSelect
                            placeholder={`Seleziona ${course.label.toLowerCase()}`}
                            value={String(valueId ?? '')}
                            options={[
                                {
                                    value: '',
                                    label: '— Nessun piatto —',
                                },
                                ...(options ?? []).map((f) => ({
                                    value: String(f.id_food),
                                    label: f.name,
                                })),
                            ]}
                            onChange={onChange}
                        />
                    )}
                </FormGroup>

                <MacroBox food={selectedFood} />
            </div>

            {showDivider && (
                <div className="border-t border-dashed border-brand-divider mt-6" />
            )}
        </div>
    );
}

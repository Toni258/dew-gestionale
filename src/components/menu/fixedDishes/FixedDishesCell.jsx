import SearchableSelect from '../../ui/SearchableSelect';
import InfoMacro from './InfoMacro';
import CheeseRotationTable from './CheeseRotationTable';

export default function FixedDishesCell({
    meal,
    courseKey,
    slots,

    loading,

    mealOptions,
    selectedArr,

    cheeseOptions,
    cheeseRotation,
    cheeseFilled,

    onSelectFood, // ({meal, courseKey, idx, food}) => {ok, reason}
    onChangeCheeseAt, // ({meal, idx, food}) => void
}) {
    // CASO SPECIALE: SECONDO -> 2 select normali + tabella formaggi
    if (courseKey === 'secondo' && slots === 3) {
        const food0 = selectedArr[0] ?? null;
        const food1 = selectedArr[1] ?? null;

        const renderSelect = (idx, food) => (
            <div key={`${meal}-${courseKey}-${idx}`}>
                <SearchableSelect
                    placeholder="Seleziona un piatto fisso"
                    value={String(food?.id_food ?? '')}
                    options={mealOptions.map((f) => ({
                        value: String(f.id_food),
                        label: f.name,
                    }))}
                    onChange={(idFoodStr) => {
                        const idFood = Number(idFoodStr);
                        const fullFood =
                            mealOptions.find(
                                (f) => Number(f.id_food) === idFood,
                            ) ?? null;

                        const res = onSelectFood({
                            meal,
                            courseKey,
                            idx,
                            food: fullFood,
                        });

                        if (!res?.ok && res?.reason === 'duplicate') {
                            alert(
                                'Questo piatto è già stato selezionato per questo pasto.',
                            );
                        }
                    }}
                    loading={loading}
                />
                <InfoMacro food={food} />
            </div>
        );

        return (
            <div className="bg-brand-sidebar px-8 py-6">
                {renderSelect(0, food0)}
                <div className="my-6 h-[2px] w-full bg-[repeating-linear-gradient(to_right,#C6C6C6_0,#C6C6C6_6px,transparent_6px,transparent_12px)]" />
                {renderSelect(1, food1)}

                <div className="my-6 h-[2px] w-full bg-[repeating-linear-gradient(to_right,#C6C6C6_0,#C6C6C6_6px,transparent_6px,transparent_12px)]" />

                <div className="text-lg font-semibold">
                    Formaggi a rotazione
                </div>

                <CheeseRotationTable
                    meal={meal}
                    cheeseRotation={cheeseRotation}
                    cheeseOptions={cheeseOptions}
                    onChangeAt={onChangeCheeseAt}
                />

                {!cheeseFilled && (
                    <div className="mt-3 text-brand-textSecondary italic opacity-80">
                        Seleziona un formaggio per ogni giorno ({meal}).
                    </div>
                )}
            </div>
        );
    }

    // DEFAULT: comportamento normale
    return (
        <div className="bg-brand-sidebar px-8 py-6">
            {Array.from({ length: slots }).map((_, idx) => {
                const food = selectedArr[idx] ?? null;

                return (
                    <div key={`${meal}-${courseKey}-${idx}`}>
                        <SearchableSelect
                            placeholder="Seleziona un piatto fisso"
                            value={String(food?.id_food ?? '')}
                            options={mealOptions.map((f) => ({
                                value: String(f.id_food),
                                label: f.name,
                            }))}
                            onChange={(idFoodStr) => {
                                const idFood = Number(idFoodStr);
                                const fullFood =
                                    mealOptions.find(
                                        (f) => Number(f.id_food) === idFood,
                                    ) ?? null;

                                const res = onSelectFood({
                                    meal,
                                    courseKey,
                                    idx,
                                    food: fullFood,
                                });

                                if (!res?.ok && res?.reason === 'duplicate') {
                                    alert(
                                        'Questo piatto è già stato selezionato per questo pasto.',
                                    );
                                }
                            }}
                            loading={loading}
                        />

                        <InfoMacro food={food} />

                        {idx < slots - 1 && (
                            <div className="my-6 h-[2px] w-full bg-[repeating-linear-gradient(to_right,#C6C6C6_0,#C6C6C6_6px,transparent_6px,transparent_12px)]" />
                        )}
                    </div>
                );
            })}
        </div>
    );
}

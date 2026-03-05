import SearchableSelect from '../../ui/SearchableSelect';
import InfoMacro from './InfoMacro';
import CheeseRotationTable from './CheeseRotationTable';

import { notify } from '../../../services/notify';

function ReadOnlyFoodCard({ food }) {
    if (!food?.name) {
        return (
            <div className="px-4 py-3 rounded-xl border border-dashed border-brand-divider bg-white/40">
                <div className="text-brand-textSecondary italic">
                    Nessun piatto selezionato
                </div>
            </div>
        );
    }

    return (
        <div className="px-4 py-3 rounded-xl border border-brand-divider bg-white/60">
            <div className="font-semibold text-lg truncate ml-4">
                {food.name}
            </div>
            {food?.type ? (
                <div className="text-xs text-brand-textSecondary">
                    {String(food.type).toUpperCase()}
                </div>
            ) : null}

            <InfoMacro food={food} />
        </div>
    );
}

export default function FixedDishesCell({
    meal,
    courseKey,
    slots,

    loading,
    readOnly = false,

    mealOptions,
    selectedArr,

    cheeseOptions,
    cheeseRotation,
    cheeseFilled,

    onSelectFood, // ({meal, courseKey, idx, food}) => {ok, reason}
    onChangeCheeseAt, // ({meal, idx, food}) => void
}) {
    const Divider = () => (
        <div className="my-6 h-[2px] w-full bg-[repeating-linear-gradient(to_right,#C6C6C6_0,#C6C6C6_6px,transparent_6px,transparent_12px)]" />
    );

    const renderSelectOrReadOnly = (idx, food) => {
        if (readOnly) {
            return (
                <div key={`${meal}-${courseKey}-${idx}`}>
                    <ReadOnlyFoodCard food={food} />
                </div>
            );
        }

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
                            notify.warning(
                                'Questo piatto è già stato selezionato per questo pasto.',
                            );
                        }
                    }}
                    loading={loading}
                />
                <InfoMacro food={food} />
            </div>
        );
    };

    // CASO SPECIALE: SECONDO -> 2 select normali + tabella formaggi
    if (courseKey === 'secondo' && slots === 3) {
        const food0 = selectedArr[0] ?? null;
        const food1 = selectedArr[1] ?? null;

        return (
            <div className="bg-brand-sidebar px-8 py-6">
                {renderSelectOrReadOnly(0, food0)}
                <div className="mt-4" />
                {renderSelectOrReadOnly(1, food1)}
                <Divider />

                <div className="text-lg font-semibold">
                    Formaggi a rotazione
                </div>

                <CheeseRotationTable
                    readOnly={readOnly}
                    meal={meal}
                    cheeseRotation={cheeseRotation}
                    cheeseOptions={cheeseOptions}
                    onChangeAt={onChangeCheeseAt}
                />

                {!readOnly && !cheeseFilled && (
                    <div className="mt-3 text-brand-textSecondary italic opacity-80">
                        Seleziona un formaggio per ogni giorno ({meal}).
                    </div>
                )}
            </div>
        );
    }

    // DEFAULT
    return (
        <div className="bg-brand-sidebar px-8 py-6">
            {Array.from({ length: slots }).map((_, idx) => {
                const food = selectedArr[idx] ?? null;

                return (
                    <div key={`${meal}-${courseKey}-${idx}`}>
                        {renderSelectOrReadOnly(idx, food)}
                        {idx < slots - 1 && <div className="mt-4" />}
                    </div>
                );
            })}
        </div>
    );
}

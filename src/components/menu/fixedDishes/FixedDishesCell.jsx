import SearchableSelect from '../../ui/SearchableSelect';
import InfoMacro from './InfoMacro';
import CheeseRotationTable from './CheeseRotationTable';

import { notify } from '../../../services/notify';

function ReadOnlyFoodCard({ food }) {
    if (!food?.name) {
        return (
            <div className="rounded-2xl border border-dashed border-brand-divider bg-white/60 px-4 py-4">
                <div className="italic text-brand-textSecondary">
                    Nessun piatto selezionato
                </div>
            </div>
        );
    }

    return (
        <div className="rounded-2xl border border-brand-divider/70 bg-white/90 px-4 py-4 shadow-[0_10px_25px_rgba(15,23,42,0.04)]">
            <div className="truncate text-lg font-semibold text-brand-text">
                {food.name}
            </div>

            {food?.type ? (
                <div className="mt-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-textSecondary">
                    {String(food.type)}
                </div>
            ) : null}

            <div className="mt-3">
                <InfoMacro food={food} />
            </div>
        </div>
    );
}

function SlotCard({ children }) {
    return (
        <div className="rounded-2xl border border-brand-divider/70 bg-white/90 p-4 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
            {children}
        </div>
    );
}

function SlotDivider() {
    return <div className="h-px w-full bg-brand-divider/70" />;
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

    onSelectFood,
    onChangeCheeseAt,
}) {
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
                <SlotCard>
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

                    <div className="mt-3">
                        <InfoMacro food={food} />
                    </div>
                </SlotCard>
            </div>
        );
    };

    if (courseKey === 'secondo' && slots === 3) {
        const food0 = selectedArr[0] ?? null;
        const food1 = selectedArr[1] ?? null;

        return (
            <div className="flex h-full flex-col gap-5 bg-white/80 px-6 py-6">
                {renderSelectOrReadOnly(0, food0)}
                {renderSelectOrReadOnly(1, food1)}

                <SlotDivider />

                <div className="rounded-2xl border border-brand-divider/70 bg-white/85 p-5 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
                    <div className="mb-4 flex items-center justify-between gap-4">
                        <div>
                            <div className="text-lg font-semibold text-brand-text">
                                Formaggi a rotazione
                            </div>
                            <div className="mt-1 text-sm text-brand-textSecondary">
                                Configura un formaggio per ciascun giorno del{' '}
                                {meal}.
                            </div>
                        </div>
                    </div>

                    <CheeseRotationTable
                        readOnly={readOnly}
                        meal={meal}
                        cheeseRotation={cheeseRotation}
                        cheeseOptions={cheeseOptions}
                        onChangeAt={onChangeCheeseAt}
                    />

                    {!readOnly && !cheeseFilled && (
                        <div className="mt-4 rounded-xl bg-brand-secondary/6 px-4 py-3 text-sm text-brand-textSecondary">
                            Seleziona un formaggio per ogni giorno ({meal}).
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-full flex-col gap-5 bg-white/80 px-6 py-6">
            {Array.from({ length: slots }).map((_, idx) => {
                const food = selectedArr[idx] ?? null;

                return (
                    <div key={`${meal}-${courseKey}-${idx}`}>
                        {renderSelectOrReadOnly(idx, food)}
                    </div>
                );
            })}
        </div>
    );
}

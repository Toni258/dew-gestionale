// Table component used for cheese rotation.
import SearchableSelect from '../../ui/SearchableSelect';
import { WEEKDAYS } from './constants';

// Component used for cheese rotation table.
function ReadOnlyPill({ food }) {
    if (!food?.name) {
        return (
            <div className="px-3 py-2 rounded-lg border border-dashed border-brand-divider text-brand-textSecondary italic bg-white/50">
                —
            </div>
        );
    }

    return (
        <div className="px-3 py-2 rounded-lg border border-brand-divider bg-white/60">
            <div className="font-semibold">{food.name}</div>
        </div>
    );
}

export default function CheeseRotationTable({
    meal,
    cheeseRotation,
    cheeseOptions,
    onChangeAt,
    readOnly = false,
}) {
    return (
        <div className="mt-4 border border-brand-divider rounded-xl">
            {WEEKDAYS.map((label, idx) => {
                const sel = cheeseRotation?.[meal]?.[idx] ?? null;

                return (
                    <div
                        key={`${meal}-${label}`}
                        className="grid grid-cols-[110px_1fr] gap-2 items-center px-3 py-2 bg-white/40"
                    >
                        <div className="font-semibold text-sm text-brand-textSecondary">
                            {label}
                        </div>

                        {readOnly ? (
                            <ReadOnlyPill food={sel} />
                        ) : (
                            <SearchableSelect
                                placeholder="Seleziona formaggio"
                                value={String(sel?.id_food ?? '')}
                                options={cheeseOptions.map((f) => ({
                                    value: String(f.id_food),
                                    label: f.name,
                                }))}
                                onChange={(idStr) => {
                                    const id = Number(idStr);
                                    const full =
                                        cheeseOptions.find(
                                            (x) => Number(x.id_food) === id,
                                        ) ?? null;
                                    onChangeAt({ meal, idx, food: full });
                                }}
                            />
                        )}
                    </div>
                );
            })}
        </div>
    );
}
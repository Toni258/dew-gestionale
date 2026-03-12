import { COURSE_ROWS } from './constants';
import FixedDishesCell from './FixedDishesCell';

function HDivider() {
    return <div className="col-start-2 col-end-5 h-px w-full bg-black/50" />;
}

function VDivider({ isLast = false }) {
    return (
        <div
            className={`w-px self-stretch bg-black/40 ${
                isLast ? 'rounded-br-xl' : ''
            }`}
        />
    );
}

function SideLabel({ children, isLast = false }) {
    return (
        <div
            className={`bg-brand-primary rounded-l-xl w-[45px] flex items-center justify-center ${
                isLast ? 'border-b border-black/40 rounded-bl-xl' : ''
            }`}
        >
            <span className="[writing-mode:vertical-rl] rotate-180 text-white font-bold text-lg tracking-widest">
                {children}
            </span>
        </div>
    );
}

export default function FixedDishesGrid({
    loading,
    readOnly = false,

    options,
    selectedFoods,

    cheeseOptions,
    cheeseRotation,
    cheeseFilled,

    onSelectFood,
    onChangeCheeseAt,
}) {
    return (
        <div className="grid grid-cols-[45px_1fr_2px_1fr] gap-x-[2px]">
            {/* header row */}
            <div />
            <div className="bg-brand-primary h-[45px] rounded-t-xl text-white flex items-center justify-center font-bold text-lg tracking-wider">
                PRANZO
            </div>
            <div />
            <div className="bg-brand-secondary h-[45px] rounded-t-xl text-white flex items-center justify-center font-bold text-lg tracking-wider">
                CENA
            </div>

            {COURSE_ROWS.map((row, idx) => {
                const isLast = idx === COURSE_ROWS.length - 1;
                const pranzoSlots = row.key === 'speciale' ? 0 : row.slots;
                const cenaSlots = row.slots;

                return (
                    <div key={row.key} className="contents">
                        <SideLabel isLast={isLast}>{row.label}</SideLabel>

                        {/* PRANZO */}
                        {pranzoSlots === 0 ? (
                            <div
                                className={`bg-white/80 px-8 py-6 ${
                                    isLast ? 'border-b border-black/30' : ''
                                }`}
                            />
                        ) : (
                            <FixedDishesCell
                                readOnly={readOnly}
                                meal="pranzo"
                                courseKey={row.key}
                                slots={pranzoSlots}
                                loading={loading}
                                mealOptions={options.pranzo?.[row.key] ?? []}
                                selectedArr={
                                    selectedFoods.pranzo?.[row.key] ?? []
                                }
                                cheeseOptions={cheeseOptions}
                                cheeseRotation={cheeseRotation}
                                cheeseFilled={cheeseFilled}
                                onSelectFood={onSelectFood}
                                onChangeCheeseAt={onChangeCheeseAt}
                            />
                        )}

                        <VDivider />

                        {/* CENA */}
                        <div
                            className={`border-r border-black/30 ${
                                isLast
                                    ? 'border-b border-black/30 rounded-br-xl'
                                    : ''
                            }`}
                        >
                            <FixedDishesCell
                                readOnly={readOnly}
                                meal="cena"
                                courseKey={row.key}
                                slots={cenaSlots}
                                loading={loading}
                                mealOptions={options.cena?.[row.key] ?? []}
                                selectedArr={
                                    selectedFoods.cena?.[row.key] ?? []
                                }
                                cheeseOptions={cheeseOptions}
                                cheeseRotation={cheeseRotation}
                                cheeseFilled={cheeseFilled}
                                onSelectFood={onSelectFood}
                                onChangeCheeseAt={onChangeCheeseAt}
                            />
                        </div>

                        {!isLast && <HDivider />}
                    </div>
                );
            })}
        </div>
    );
}

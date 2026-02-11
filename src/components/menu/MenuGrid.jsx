import Button from '../ui/Button';

const DAYS_HEADER = [1, 2, 3, 4, 5, 6, 7];
const WEEKS_HEADER = [1, 2, 3, 4];

export default function MenuGrid({ menu, mealsByDay, onOpenMeal }) {
    return (
        <div className="mt-4 overflow-x-auto">
            <div className="flex justify-center min-w-fit">
                <div className="menu-grid-wrapper">
                    <div className="menu-grid">
                        <div className="menu-grid__corner" />

                        {DAYS_HEADER.map((d, idx) => (
                            <div
                                key={`day-h-${d}`}
                                className={`menu-grid__dayHeader ${
                                    idx === 0
                                        ? 'menu-grid__dayHeader--first'
                                        : ''
                                } ${
                                    idx === DAYS_HEADER.length - 1
                                        ? 'menu-grid__dayHeader--last'
                                        : ''
                                }`}
                            >
                                {d}
                            </div>
                        ))}

                        {WEEKS_HEADER.map((w, weekIdx) => (
                            <div key={`week-row-${w}`} className="contents">
                                <div
                                    className={`menu-grid__weekHeader ${
                                        weekIdx === 0
                                            ? 'menu-grid__weekHeader--first'
                                            : ''
                                    } ${
                                        weekIdx === WEEKS_HEADER.length - 1
                                            ? 'menu-grid__weekHeader--last'
                                            : ''
                                    }`}
                                >
                                    {w}
                                </div>

                                {DAYS_HEADER.map((_, dayIdx) => {
                                    const dayIndex = weekIdx * 7 + dayIdx;

                                    const pranzo = mealsByDay[dayIndex]?.pranzo;
                                    const cena = mealsByDay[dayIndex]?.cena;

                                    const pranzoHasIssues =
                                        pranzo &&
                                        !pranzo.is_completed &&
                                        pranzo.day_dishes_count > 0;

                                    const cenaHasIssues =
                                        cena &&
                                        !cena.is_completed &&
                                        cena.day_dishes_count > 0;

                                    const pranzoCompleted = Boolean(
                                        pranzo?.is_completed,
                                    );
                                    const cenaCompleted = Boolean(
                                        cena?.is_completed,
                                    );

                                    const isLastColumn = dayIdx === 6;
                                    const isLastRow = weekIdx === 3;
                                    const isActiveDay =
                                        dayIndex === menu.day_index;

                                    return (
                                        <div
                                            key={`cell-${dayIndex}`}
                                            className={`menu-grid__cell
                                                ${isLastColumn ? 'no-v-divider' : ''}
                                                ${isLastRow ? 'no-h-divider' : ''}
                                                ${isActiveDay ? 'menu-grid__cell--active' : ''}
                                            `}
                                        >
                                            {isActiveDay && (
                                                <span className="menu-grid__activeDot" />
                                            )}

                                            <div className="menu-grid__mealBlock">
                                                <span className="menu-grid__mealTitle">
                                                    Pranzo
                                                </span>
                                                <Button
                                                    variant={
                                                        pranzoCompleted
                                                            ? 'primary'
                                                            : pranzoHasIssues
                                                              ? 'danger'
                                                              : 'secondary'
                                                    }
                                                    size="md"
                                                    className="px-3 py-1 rounded-[6px]"
                                                    onClick={() =>
                                                        onOpenMeal({
                                                            dayIndex,
                                                            mealType: 'pranzo',
                                                        })
                                                    }
                                                >
                                                    {pranzoCompleted
                                                        ? 'Modifica'
                                                        : pranzoHasIssues
                                                          ? 'Da correggere'
                                                          : 'Componi'}
                                                </Button>
                                            </div>

                                            <div className="menu-grid__mealBlock">
                                                <span className="menu-grid__mealTitle">
                                                    Cena
                                                </span>
                                                <Button
                                                    variant={
                                                        cenaCompleted
                                                            ? 'primary'
                                                            : cenaHasIssues
                                                              ? 'danger'
                                                              : 'secondary'
                                                    }
                                                    size="md"
                                                    className="px-3 py-1 rounded-[6px]"
                                                    onClick={() =>
                                                        onOpenMeal({
                                                            dayIndex,
                                                            mealType: 'cena',
                                                        })
                                                    }
                                                >
                                                    {cenaCompleted
                                                        ? 'Modifica'
                                                        : cenaHasIssues
                                                          ? 'Da correggere'
                                                          : 'Componi'}
                                                </Button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

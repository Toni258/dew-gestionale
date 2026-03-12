import Button from '../ui/Button';

const DAYS_HEADER = [
    { number: 1, label: 'Lunedì' },
    { number: 2, label: 'Martedì' },
    { number: 3, label: 'Mercoledì' },
    { number: 4, label: 'Giovedì' },
    { number: 5, label: 'Venerdì' },
    { number: 6, label: 'Sabato' },
    { number: 7, label: 'Domenica' },
];
const WEEKS_HEADER = [1, 2, 3, 4];

export default function MenuGrid({
    menu,
    mealsByDay,
    onOpenMeal,
    readOnly = false,
}) {
    return (
        <div className="mt-4 overflow-x-auto">
            <div className="flex justify-center min-w-fit">
                <div className="menu-grid-wrapper">
                    <div className="menu-grid">
                        <div className="menu-grid__corner" />

                        {DAYS_HEADER.map((day, idx) => (
                            <div
                                key={`day-h-${day.number}`}
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
                                {day.label}
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

                                    const labelPranzo = readOnly
                                        ? 'Apri'
                                        : pranzoCompleted
                                          ? 'Modifica'
                                          : pranzoHasIssues
                                            ? 'Da correggere'
                                            : 'Componi';

                                    const labelCena = readOnly
                                        ? 'Apri'
                                        : cenaCompleted
                                          ? 'Modifica'
                                          : cenaHasIssues
                                            ? 'Da correggere'
                                            : 'Componi';

                                    return (
                                        <div
                                            key={`cell-${dayIndex}`}
                                            className={`menu-grid__cell
                                                ${isLastColumn ? 'no-v-divider' : ''}
                                                ${isLastRow ? 'no-h-divider' : ''}
                                                ${isActiveDay && !readOnly ? 'menu-grid__cell--active' : ''}
                                            `}
                                        >
                                            {isActiveDay && !readOnly && (
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
                                                    className={`rounded-md ${
                                                        readOnly
                                                            ? 'px-8 py-1'
                                                            : ''
                                                    }`}
                                                    onClick={() =>
                                                        onOpenMeal({
                                                            dayIndex,
                                                            mealType: 'pranzo',
                                                        })
                                                    }
                                                >
                                                    {labelPranzo}
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
                                                    className={`rounded-md ${
                                                        readOnly
                                                            ? 'px-8 py-1'
                                                            : ''
                                                    }`}
                                                    onClick={() =>
                                                        onOpenMeal({
                                                            dayIndex,
                                                            mealType: 'cena',
                                                        })
                                                    }
                                                >
                                                    {labelCena}
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

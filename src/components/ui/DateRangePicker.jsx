// Reusable date range picker.
import { useState, useRef, useEffect, useMemo } from 'react';
import { useFormContext } from './Form';

// Converts the input into day start.
function toDayStart(d) {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x;
}

// Parses the value used by limit.
function parseLimit(value) {
    if (!value) return null;
    if (value instanceof Date) return toDayStart(value);
    // assume "YYYY-MM-DD"
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return null;
    return toDayStart(d);
}

export default function DateRangePicker({
    startName,
    endName,
    disablePast = false,

    // nuove props
    minDate = null, // "YYYY-MM-DD" | Date | null
    maxDate = null, // "YYYY-MM-DD" | Date | null

    placeholderStart = 'Inizio',
    placeholderEnd = 'Fine',
    className = '',
}) {
    const form = useFormContext();

    const startValue = form?.values[startName] ?? '';
    const endValue = form?.values[endName] ?? '';
    const errorStart = form?.errors[startName];
    const errorEnd = form?.errors[endName];

    const [open, setOpen] = useState(false);
    const [selecting, setSelecting] = useState('start');
    const [hoverDate, setHoverDate] = useState(null);

    const wrapperRef = useRef(null);

    // ==== Date reference ====
    const today = new Date();
    const todayStart = useMemo(() => toDayStart(today), []);

    // limiti esterni (menu start/end)
    const minD = useMemo(() => parseLimit(minDate), [minDate]);
    const maxD = useMemo(() => parseLimit(maxDate), [maxDate]);

    const base = startValue ? new Date(startValue) : today;

    // Stato UNIFICATO (mese principale)
    const [current, setCurrent] = useState({
        year: base.getFullYear(),
        month: base.getMonth(),
    });

    // start / end come Date (o null)
    const startDate = startValue ? toDayStart(new Date(startValue)) : null;
    const endDate = endValue ? toDayStart(new Date(endValue)) : null;

    // =========== CLOSE ON CLICK OUTSIDE =============
    useEffect(() => {
        const handler = (e) => {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
                setOpen(false);
                setHoverDate(null);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // =========== HELPERS ===========

    const toISO = (d) => {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const formatDisplay = (iso) => {
        if (!iso) return '';
        const [year, month, day] = iso.split('-');
        return `${day}/${month}/${year}`;
    };

    const dateObj = (year, month, day) =>
        toDayStart(new Date(year, month, day));

    const inLimits = (d) => {
        const x = toDayStart(d);
        if (disablePast && x < todayStart) return false;
        if (minD && x < minD) return false;
        if (maxD && x > maxD) return false;
        return true;
    };

    // =========== CALENDAR GEN ===========

    const generateCalendar = (year, month) => {
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);

        const days = lastDay.getDate();
        const startWeekday = firstDay.getDay();

        let weeks = [];
        let week = [];

        const empty = startWeekday === 0 ? 6 : startWeekday - 1;
        for (let i = 0; i < empty; i++) week.push(null);

        for (let d = 1; d <= days; d++) {
            week.push(d);
            if (week.length === 7) {
                weeks.push(week);
                week = [];
            }
        }
        if (week.length) weeks.push(week);

        return weeks;
    };

    const thisMonth = generateCalendar(current.year, current.month);

    // Mese successivo
    const nextYear = current.month === 11 ? current.year + 1 : current.year;
    const nextMonthIndex = current.month === 11 ? 0 : current.month + 1;
    const nextCalendar = generateCalendar(nextYear, nextMonthIndex);

    // ======= month nav bounds helpers =======
    const monthStart = (y, m) => toDayStart(new Date(y, m, 1));
    const monthEnd = (y, m) => toDayStart(new Date(y, m + 1, 0));

    const canGoPrev = () => {
        if (!minD) return true;
        // mese precedente rispetto a current
        const py = current.month === 0 ? current.year - 1 : current.year;
        const pm = current.month === 0 ? 11 : current.month - 1;
        return monthEnd(py, pm) >= minD;
    };

    const canGoNext = () => {
        if (!maxD) return true;
        // mese successivo rispetto a current
        const ny = current.month === 11 ? current.year + 1 : current.year;
        const nm = current.month === 11 ? 0 : current.month + 1;
        return monthStart(ny, nm) <= maxD;
    };

    // =========== MONTH CHANGE ===========

    const nextMonth = () => {
        if (!canGoNext()) return;
        setCurrent((prev) => {
            if (prev.month === 11) return { year: prev.year + 1, month: 0 };
            return { ...prev, month: prev.month + 1 };
        });
        setHoverDate(null);
    };

    const prevMonth = () => {
        if (!canGoPrev()) return;
        setCurrent((prev) => {
            if (prev.month === 0) return { year: prev.year - 1, month: 11 };
            return { ...prev, month: prev.month - 1 };
        });
        setHoverDate(null);
    };

    // =========== DAY CLICK ===========

    const handleSelectDay = (year, month, day) => {
        if (!day) return;

        const d = dateObj(year, month, day);
        if (!inLimits(d)) return;

        if (selecting === 'start') {
            form?.setFieldValue(startName, toISO(d));
            form?.setFieldValue(endName, '');
            setSelecting('end');
            setHoverDate(null);
        } else {
            if (!startDate) return;
            if (d <= startDate) return; // end deve essere > start
            if (!inLimits(d)) return;

            form?.setFieldValue(endName, toISO(d));
            setSelecting('start');
            setOpen(false);
            setHoverDate(null);
        }
    };

    // UI
    return (
        <div className={`flex flex-col gap-3 ${className}`} ref={wrapperRef}>
            <div className="relative">
                {/* INPUT ROW */}
                <div className="grid grid-cols-2 gap-3">
                    {/* START */}
                    <div className="relative h-[38px]">
                        <button
                            type="button"
                            onClick={() => {
                                if (open && selecting === 'start') {
                                    setOpen(false);
                                    setHoverDate(null);
                                } else {
                                    setOpen(true);
                                    setSelecting('start');
                                }
                            }}
                            className={`input-default h-full w-full pr-10 text-left ${
                                errorStart
                                    ? 'border-brand-error'
                                    : 'border-brand-divider'
                            }`}
                        >
                            {startValue ? (
                                formatDisplay(startValue)
                            ) : (
                                <span className="text-brand-textSecondary">
                                    {placeholderStart}
                                </span>
                            )}
                            <span className="absolute right-3 top-1/2 -translate-y-1/2">
                                📅
                            </span>
                        </button>
                    </div>

                    {/* END */}
                    <div className="relative h-[38px]">
                        <button
                            type="button"
                            onClick={() => {
                                if (open && selecting === 'end') {
                                    setOpen(false);
                                    setHoverDate(null);
                                } else {
                                    setOpen(true);
                                    setSelecting('end');
                                }
                            }}
                            className={`input-default h-full w-full pr-10 text-left ${
                                errorEnd
                                    ? 'border-brand-error'
                                    : 'border-brand-divider'
                            }`}
                        >
                            {endValue ? (
                                formatDisplay(endValue)
                            ) : (
                                <span className="text-brand-textSecondary">
                                    {placeholderEnd}
                                </span>
                            )}
                            <span className="absolute right-3 top-1/2 -translate-y-1/2">
                                📅
                            </span>
                        </button>
                    </div>
                </div>

                {/* CALENDAR PANEL */}
                {open && (
                    <div
                        className="
                            absolute left-0 top-full mt-2
                            w-full
                            bg-white border border-brand-divider shadow-ios-strong
                            rounded-textField p-4 animate-fadeScale z-50
                        "
                    >
                        {/* HEADER */}
                        <div className="relative mb-4">
                            <button
                                type="button"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={prevMonth}
                                disabled={!canGoPrev()}
                                className={`absolute left-0 top-1/2 -translate-y-1/2 px-2 py-1 rounded-md
                                    ${canGoPrev() ? 'hover:bg-black/10' : 'opacity-30 cursor-not-allowed'}
                                `}
                            >
                                ◀
                            </button>

                            <div className="grid grid-cols-2 text-center font-semibold text-brand-text">
                                <div>
                                    {current.month + 1}/{current.year}
                                </div>
                                <div>
                                    {nextMonthIndex + 1}/{nextYear}
                                </div>
                            </div>

                            <button
                                type="button"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={nextMonth}
                                disabled={!canGoNext()}
                                className={`absolute right-0 top-1/2 -translate-y-1/2 px-2 py-1 rounded-md
                                    ${canGoNext() ? 'hover:bg-black/10' : 'opacity-30 cursor-not-allowed'}
                                `}
                            >
                                ▶
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-8 w-full">
                            <CalendarGrid
                                year={current.year}
                                month={current.month}
                                weeks={thisMonth}
                                todayStart={todayStart}
                                startDate={startDate}
                                endDate={endDate}
                                hoverDate={hoverDate}
                                selecting={selecting}
                                setHoverDate={setHoverDate}
                                handleSelectDay={handleSelectDay}
                                disablePast={disablePast}
                                minD={minD}
                                maxD={maxD}
                            />

                            <CalendarGrid
                                year={nextYear}
                                month={nextMonthIndex}
                                weeks={nextCalendar}
                                todayStart={todayStart}
                                startDate={startDate}
                                endDate={endDate}
                                hoverDate={hoverDate}
                                selecting={selecting}
                                setHoverDate={setHoverDate}
                                handleSelectDay={handleSelectDay}
                                disablePast={disablePast}
                                minD={minD}
                                maxD={maxD}
                            />
                        </div>
                    </div>
                )}
            </div>

            {(errorStart?.trim() || errorEnd?.trim()) && (
                <div className="grid grid-cols-2 gap-3">
                    <div className="min-h-[16px]">
                        {errorStart && (
                            <p className="text-brand-error text-sm animate-fadeIn mb-2">
                                {errorStart}
                            </p>
                        )}
                    </div>

                    <div className="min-h-[16px]">
                        {errorEnd && (
                            <p className="text-brand-error text-sm animate-fadeIn mb-2">
                                {errorEnd}
                            </p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

// =====================================
// SUB COMPONENT: CALENDAR GRID
// =====================================
function CalendarGrid({
    year,
    month,
    weeks,

    disablePast,
    todayStart,
    minD,
    maxD,

    startDate,
    endDate,
    hoverDate,
    selecting,
    setHoverDate,
    handleSelectDay,
}) {
    const dateObj = (day) => toDayStart(new Date(year, month, day));

    const sameDay = (a, b) => {
        if (!a || !b) return false;
        return (
            a.getFullYear() === b.getFullYear() &&
            a.getMonth() === b.getMonth() &&
            a.getDate() === b.getDate()
        );
    };

    const isDisabledByLimits = (d) => {
        if (disablePast && d < todayStart) return true;
        if (minD && d < minD) return true;
        if (maxD && d > maxD) return true;
        return false;
    };

    return (
        <div className="flex flex-col items-center">
            <div className="grid grid-cols-7 gap-[4px] w-full text-center text-sm font-semibold text-brand-textSecondary mb-1">
                <div>L</div>
                <div>M</div>
                <div>M</div>
                <div>G</div>
                <div>V</div>
                <div>S</div>
                <div>D</div>
            </div>

            <div className="grid grid-cols-7 gap-[4px] text-center w-full">
                {weeks.flat().map((day, idx) => {
                    if (!day) return <div key={idx} />;

                    const cellDate = dateObj(day);

                    const disabled = isDisabledByLimits(cellDate);
                    const isStart = sameDay(cellDate, startDate);
                    const isEnd = sameDay(cellDate, endDate);

                    let inRange = false;
                    let inHoverRange = false;

                    if (startDate) {
                        const rangeEnd = endDate || hoverDate;
                        if (rangeEnd) {
                            // range visivo: lo mostriamo solo se dentro i limiti (così non “colora” fuori menu)
                            const lo = startDate;
                            const hi = rangeEnd;
                            inRange =
                                cellDate > lo &&
                                cellDate < hi &&
                                !isDisabledByLimits(cellDate);
                        }
                    }

                    if (
                        selecting === 'end' &&
                        startDate &&
                        !endDate &&
                        hoverDate
                    ) {
                        inHoverRange =
                            cellDate > startDate &&
                            cellDate < hoverDate &&
                            !isDisabledByLimits(cellDate);
                    }

                    return (
                        <div
                            key={idx}
                            onMouseEnter={() => {
                                if (
                                    selecting === 'end' &&
                                    startDate &&
                                    !endDate &&
                                    !disabled
                                ) {
                                    setHoverDate(cellDate);
                                }
                            }}
                            onMouseLeave={() => {
                                if (
                                    selecting === 'end' &&
                                    startDate &&
                                    !endDate
                                ) {
                                    setHoverDate(null);
                                }
                            }}
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() =>
                                !disabled && handleSelectDay(year, month, day)
                            }
                            className={`
                                h-8 flex items-center justify-center rounded-[6px]
                                select-none transition-all duration-150 cursor-pointer
                                ${
                                    disabled
                                        ? 'text-black/30 bg-black/5 pointer-events-none'
                                        : ''
                                }
                                ${
                                    isStart || isEnd
                                        ? 'bg-brand-primary text-white font-semibold'
                                        : inRange || inHoverRange
                                          ? 'bg-brand-primary/20 text-brand-primary font-semibold'
                                          : !disabled
                                            ? 'hover:bg-brand-primary/10 hover:scale-[1.08]'
                                            : ''
                                }
                            `}
                        >
                            {day}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
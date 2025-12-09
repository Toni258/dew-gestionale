import { useState, useRef, useEffect } from 'react';
import { useFormContext } from './Form';

export default function DateRangePicker({
    startName,
    endName,
    disablePast = false,
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
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const base = startValue ? new Date(startValue) : today;

    // Stato UNIFICATO (mese principale)
    const [current, setCurrent] = useState({
        year: base.getFullYear(),
        month: base.getMonth(),
    });

    // start / end come Date (o null)
    const startDate = startValue ? new Date(startValue) : null;
    const endDate = endValue ? new Date(endValue) : null;

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

    const dateObj = (year, month, day) => new Date(year, month, day);

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

    // =========== MONTH CHANGE ===========

    const nextMonth = () => {
        setCurrent((prev) => {
            if (prev.month === 11) {
                return { year: prev.year + 1, month: 0 };
            }
            return { ...prev, month: prev.month + 1 };
        });
        setHoverDate(null);
    };

    const prevMonth = () => {
        setCurrent((prev) => {
            if (prev.month === 0) {
                return { year: prev.year - 1, month: 11 };
            }
            return { ...prev, month: prev.month - 1 };
        });
        setHoverDate(null);
    };

    // =========== DAY CLICK ===========

    const handleSelectDay = (year, month, day) => {
        if (!day) return;

        const d = dateObj(year, month, day);
        if (disablePast && d < todayStart) return;

        if (selecting === 'start') {
            form?.setFieldValue(startName, toISO(d));
            form?.setFieldValue(endName, '');
            setSelecting('end');
            setHoverDate(null);
        } else {
            if (!startDate) return;
            if (d <= startDate) return;

            form?.setFieldValue(endName, toISO(d));
            setSelecting('start');
            setOpen(false);
            setHoverDate(null);
        }
    };

    // ===================================
    // UI
    // ===================================
    // ===================================
    // UI
    // ===================================
    return (
        <div
            className={`relative flex flex-col gap-3 ${className}`}
            ref={wrapperRef}
        >
            {/* INPUT ROW */}
            <div className="grid grid-cols-2 gap-3">
                {/* START */}
                <div className="relative h-[38px]">
                    <button
                        type="button"
                        onClick={() => {
                            // toggle: se sto già aprendo "start" e open è true, chiudo
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
                        {startValue || (
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
                            // toggle: se sto già aprendo "end" e open è true, chiudo
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
                        {endValue || (
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

            {(errorStart || errorEnd) && (
                <span className="text-brand-error text-sm -mt-2 animate-fadeIn">
                    {errorStart || errorEnd}
                </span>
            )}

            {/* CALENDAR PANEL (overlay, non spinge il layout) */}
            {open && (
                <div
                    className="
                    absolute left-0 top-full mt-2
                    w-full
                    bg-white border border-brand-divider shadow-ios-strong
                    rounded-textField p-4 animate-fadeScale z-50
                "
                >
                    {/* HEADER UNICO con frecce agli estremi e mesi centrati */}
                    <div className="relative mb-4">
                        {/* Freccia sinistra agli estremi */}
                        <button
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={prevMonth}
                            className="absolute left-0 top-1/2 -translate-y-1/2 px-2 py-1 hover:bg-black/10 rounded-md"
                        >
                            ◀
                        </button>

                        {/* Grid centrale: 2 mesi sopra ai due calendari */}
                        <div className="grid grid-cols-2 text-center font-semibold text-brand-text">
                            <div>
                                {current.month + 1}/{current.year}
                            </div>
                            <div>
                                {nextMonthIndex + 1}/{nextYear}
                            </div>
                        </div>

                        {/* Freccia destra agli estremi */}
                        <button
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={nextMonth}
                            className="absolute right-0 top-1/2 -translate-y-1/2 px-2 py-1 hover:bg-black/10 rounded-md"
                        >
                            ▶
                        </button>
                    </div>

                    {/* DOUBLE CALENDAR GRID */}
                    <div className="grid grid-cols-2 gap-8 w-full">
                        {/* LEFT MONTH */}
                        <CalendarGrid
                            year={current.year}
                            month={current.month}
                            weeks={thisMonth}
                            disablePast={disablePast}
                            todayStart={todayStart}
                            startDate={startDate}
                            endDate={endDate}
                            hoverDate={hoverDate}
                            selecting={selecting}
                            setHoverDate={setHoverDate}
                            handleSelectDay={handleSelectDay}
                        />

                        {/* RIGHT MONTH */}
                        <CalendarGrid
                            year={nextYear}
                            month={nextMonthIndex}
                            weeks={nextCalendar}
                            disablePast={disablePast}
                            todayStart={todayStart}
                            startDate={startDate}
                            endDate={endDate}
                            hoverDate={hoverDate}
                            selecting={selecting}
                            setHoverDate={setHoverDate}
                            handleSelectDay={handleSelectDay}
                        />
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
    startDate,
    endDate,
    hoverDate,
    selecting,
    setHoverDate,
    handleSelectDay,
}) {
    const dateObj = (day) => new Date(year, month, day);

    const isPast = (day) => {
        const d = dateObj(day);
        return d < todayStart;
    };

    const sameDay = (a, b) => {
        if (!a || !b) return false;
        return (
            a.getFullYear() === b.getFullYear() &&
            a.getMonth() === b.getMonth() &&
            a.getDate() === b.getDate()
        );
    };

    return (
        <div className="flex flex-col items-center">
            {/* Giorni settimana */}
            <div className="grid grid-cols-7 gap-[4px] w-full text-center text-sm font-semibold text-brand-textSecondary mb-1">
                <div>L</div>
                <div>M</div>
                <div>M</div>
                <div>G</div>
                <div>V</div>
                <div>S</div>
                <div>D</div>
            </div>

            {/* Giorni */}
            <div className="grid grid-cols-7 gap-[4px] text-center w-full">
                {weeks.flat().map((day, idx) => {
                    if (!day) return <div key={idx} />;

                    const cellDate = dateObj(day);

                    const disabled = disablePast && isPast(day);
                    const isStart = sameDay(cellDate, startDate);
                    const isEnd = sameDay(cellDate, endDate);

                    let inRange = false;
                    let inHoverRange = false;

                    if (startDate) {
                        const rangeEnd = endDate || hoverDate;
                        if (rangeEnd) {
                            inRange =
                                cellDate > startDate && cellDate < rangeEnd;
                        }
                    }

                    if (
                        selecting === 'end' &&
                        startDate &&
                        !endDate &&
                        hoverDate
                    ) {
                        inHoverRange =
                            cellDate > startDate && cellDate < hoverDate;
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

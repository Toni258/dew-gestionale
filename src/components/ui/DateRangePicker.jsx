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

    // Stato UNIFICATO
    const [current, setCurrent] = useState({
        year: base.getFullYear(),
        month: base.getMonth(),
    });

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
    const toISO = (d) => d.toISOString().split('T')[0];

    const dateObj = (year, month, day) => new Date(year, month, day);

    const isPast = (year, month, day) => {
        const d = dateObj(year, month, day);
        return d < todayStart;
    };

    const isStart = (day) =>
        startValue &&
        new Date(startValue).getTime() ===
            dateObj(current.year, current.month, day).getTime();

    const isEnd = (day) =>
        endValue &&
        new Date(endValue).getTime() ===
            dateObj(current.year, current.month, day).getTime();

    const isBetween = (day) => {
        if (!startValue) return false;

        const d = dateObj(current.year, current.month, day);
        const start = new Date(startValue);
        const end = endValue ? new Date(endValue) : hoverDate;

        if (!end) return false;
        return d > start && d < end;
    };

    const isHover = (day) => {
        if (selecting !== 'end') return false;
        if (!startValue) return false;
        if (endValue) return false;
        if (!hoverDate) return false;

        const d = dateObj(current.year, current.month, day);
        return d > new Date(startValue) && d < hoverDate;
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
            const start = new Date(startValue);
            if (d <= start) return;

            form?.setFieldValue(endName, toISO(d));
            setSelecting('start');
            setOpen(false);
            setHoverDate(null);
        }
    };

    // ===================================
    // UI
    // ===================================
    return (
        <div className={`flex flex-col gap-3 ${className}`} ref={wrapperRef}>
            {/* INPUT ROW */}
            <div className="grid grid-cols-2 gap-3">
                {/* START */}
                <div className="relative h-[38px]">
                    <button
                        type="button"
                        onClick={() => {
                            setOpen(true);
                            setSelecting('start');
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
                            setOpen(true);
                            setSelecting('end');
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

            {/* CALENDAR PANEL */}
            {open && (
                <div
                    className="
                        bg-white border border-brand-divider shadow-ios-strong
                        rounded-textField p-4 animate-fadeScale z-50
                    "
                >
                    {/* HEADER */}
                    <div className="flex justify-between items-center mb-4">
                        <button
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={prevMonth}
                            className="px-2 py-1 hover:bg-black/10 rounded-md"
                        >
                            ◀
                        </button>

                        <div className="font-semibold text-brand-text">
                            {current.month + 1}/{current.year}
                        </div>

                        <button
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={nextMonth}
                            className="px-2 py-1 hover:bg-black/10 rounded-md"
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
                            isStart={isStart}
                            isEnd={isEnd}
                            isBetween={isBetween}
                            isHover={isHover}
                            onHover={setHoverDate}
                            handleSelectDay={handleSelectDay}
                        />

                        {/* RIGHT MONTH */}
                        <CalendarGrid
                            year={nextYear}
                            month={nextMonthIndex}
                            weeks={nextCalendar}
                            disablePast={disablePast}
                            todayStart={todayStart}
                            isStart={isStart}
                            isEnd={isEnd}
                            isBetween={isBetween}
                            isHover={isHover}
                            onHover={setHoverDate}
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
    isStart,
    isEnd,
    isBetween,
    isHover,
    onHover,
    handleSelectDay,
}) {
    const dateObj = (d) => new Date(year, month, d);

    const isPast = (day) => {
        const d = dateObj(day);
        return d < todayStart;
    };

    return (
        <div className="flex flex-col items-center">
            <div className="font-semibold mb-2">
                {month + 1}/{year}
            </div>

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

                    const disabled = disablePast && isPast(day);
                    const start = isStart(day);
                    const end = isEnd(day);
                    const inside = isBetween(day);
                    const hovering = isHover(day);

                    return (
                        <div
                            key={idx}
                            onMouseEnter={() => {
                                if (!disabled) onHover(dateObj(day));
                            }}
                            onMouseLeave={() => onHover(null)}
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
                                    start || end
                                        ? 'bg-brand-primary text-white font-semibold'
                                        : inside || hovering
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

import { useState, useRef, useEffect } from 'react';
import { useFormContext } from './Form';

export default function DatePicker({
    name,
    placeholder = 'Seleziona una data...',
    disablePast = false,
    className = '',
    ...props
}) {
    const form = useFormContext();
    const selectedValue = form?.values[name] ?? '';
    const error = form?.errors[name];

    const [open, setOpen] = useState(false);

    const wrapperRef = useRef(null);
    const buttonRef = useRef(null);

    // ===============================
    // DATA DI RIFERIMENTO
    // ===============================
    const today = new Date();
    const currentDate = selectedValue ? new Date(selectedValue) : today;

    const [current, setCurrent] = useState({
        year: currentDate.getFullYear(),
        month: currentDate.getMonth(),
    });

    const firstDay = new Date(current.year, current.month, 1);
    const lastDay = new Date(current.year, current.month + 1, 0);

    const daysInMonth = lastDay.getDate();
    const startWeekday = firstDay.getDay();

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    // ===============================
    // CHIUDI CLICK FUORI
    // ===============================
    useEffect(() => {
        const handler = (e) => {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // ===============================
    // GENERA WEEKS DEL CALENDARIO
    // ===============================
    let calendar = [];
    let week = [];

    const emptySlots = startWeekday === 0 ? 6 : startWeekday - 1;
    for (let i = 0; i < emptySlots; i++) week.push(null);

    for (let d = 1; d <= daysInMonth; d++) {
        week.push(d);
        if (week.length === 7) {
            calendar.push(week);
            week = [];
        }
    }
    if (week.length) calendar.push(week);

    // ===============================
    // CAMBIA MESE
    // ===============================
    const nextMonth = () => {
        setCurrent((prev) => {
            if (prev.month === 11) {
                return { year: prev.year + 1, month: 0 };
            }
            return { ...prev, month: prev.month + 1 };
        });
    };

    const prevMonth = () => {
        setCurrent((prev) => {
            if (prev.month === 0) {
                return { year: prev.year - 1, month: 11 };
            }
            return { ...prev, month: prev.month - 1 };
        });
    };

    // ===============================
    // SELEZIONA DATA
    // ===============================
    const handleSelectDate = (day) => {
        if (!day) return;
        const selected = new Date(current.year, current.month, day);

        if (disablePast && selected < todayStart) return;

        const formatted = selected.toISOString().split('T')[0];
        form?.setFieldValue(name, formatted);
        setOpen(false);
    };

    const isPast = (day) => {
        const d = new Date(current.year, current.month, day);
        return d < todayStart;
    };

    // ===============================
    // UI
    // ===============================
    const radius = open
        ? 'rounded-t-textField rounded-b-none'
        : 'rounded-textField';

    return (
        <div ref={wrapperRef} className={`flex flex-col ${className}`}>
            <div className="relative h-[38px]">
                {/* BUTTON INPUT */}
                <button
                    type="button"
                    ref={buttonRef}
                    onClick={() => setOpen((o) => !o)}
                    className={`
                    input-default w-full text-left h-[38px] pr-10
                    flex items-center justify-between
                    transition-all duration-300
                    ${radius}
                    ${open ? 'shadow-ios-strong' : ''}
                    ${error ? 'border-brand-error' : 'border-brand-divider'}
                `}
                >
                    <span
                        className={`${
                            !selectedValue ? 'text-brand-textSecondary' : ''
                        }`}
                    >
                        {selectedValue || placeholder}
                    </span>

                    <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-70">
                        📅
                    </div>
                </button>

                {/* CALENDARIO */}
                {open && (
                    <div
                        className="
                        absolute left-0 right-0 top-full z-50 bg-white
                        border border-brand-divider border-t-0
                        rounded-b-textField shadow-ios-strong
                        animate-fadeScale p-3
                    "
                    >
                        {/* HEADER MESE */}
                        <div className="flex items-center justify-between mb-2">
                            <button
                                type="button"
                                tabIndex={-1}
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={prevMonth}
                                className="px-2 py-1 hover:bg-black/10 rounded-md"
                            >
                                ◀
                            </button>

                            <div className="text-brand-text font-semibold">
                                {current.month + 1}/{current.year}
                            </div>

                            <button
                                type="button"
                                tabIndex={-1}
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={nextMonth}
                                className="px-2 py-1 hover:bg-black/10 rounded-md"
                            >
                                ▶
                            </button>
                        </div>

                        {/* GIORNI SETTIMANA */}
                        <div className="grid grid-cols-7 text-center text-sm font-semibold text-brand-textSecondary mb-1">
                            <div>L</div>
                            <div>M</div>
                            <div>M</div>
                            <div>G</div>
                            <div>V</div>
                            <div>S</div>
                            <div>D</div>
                        </div>

                        {/* GIORNI */}
                        <div className="grid grid-cols-7 text-center gap-[3px]">
                            {calendar.flat().map((day, idx) => {
                                if (!day) return <div key={idx} />;

                                const selected =
                                    selectedValue &&
                                    parseInt(selectedValue.split('-')[2]) ===
                                        day;

                                const past = disablePast && isPast(day);

                                return (
                                    <div
                                        key={idx}
                                        onClick={() =>
                                            !past && handleSelectDate(day)
                                        }
                                        className={`
                                        h-8 flex items-center justify-center select-none rounded-[6px]
                                        transition-all duration-150 cursor-pointer

                                        ${
                                            past
                                                ? 'text-black/30 bg-black/5 pointer-events-none'
                                                : 'hover:bg-brand-primary/10 hover:scale-[1.05]'
                                        }

                                        ${
                                            selected
                                                ? 'bg-brand-primary text-white font-semibold hover:scale-100'
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
                )}
            </div>

            {error && (
                <span className="text-brand-error text-sm mt-1 animate-fadeIn">
                    {error}
                </span>
            )}
        </div>
    );
}

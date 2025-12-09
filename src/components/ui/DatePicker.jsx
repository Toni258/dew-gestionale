import { useState, useRef, useEffect } from 'react';
import { useFormContext } from './Form';

export default function DatePicker({
    name,
    placeholder = 'Seleziona una data...',
    disablePast = false,
    className = '',
}) {
    const form = useFormContext();

    const selectedValue = form?.values[name] ?? '';
    const error = form?.errors[name];

    const [open, setOpen] = useState(false);
    const wrapperRef = useRef(null);

    // ========== Data corrente ==========
    const today = new Date();
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const base = selectedValue ? new Date(selectedValue) : today;

    const [current, setCurrent] = useState({
        year: base.getFullYear(),
        month: base.getMonth(),
    });

    // ========== Chiudi click fuori ==========
    useEffect(() => {
        const handler = (e) => {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // ========== Genera calendario ==========
    const generateCalendar = (year, month) => {
        const first = new Date(year, month, 1);
        const last = new Date(year, month + 1, 0);

        const days = last.getDate();
        const startWeekday = first.getDay();

        const empty = startWeekday === 0 ? 6 : startWeekday - 1;

        let weeks = [];
        let w = [];

        for (let i = 0; i < empty; i++) w.push(null);

        for (let d = 1; d <= days; d++) {
            w.push(d);
            if (w.length === 7) {
                weeks.push(w);
                w = [];
            }
        }
        if (w.length) weeks.push(w);

        return weeks;
    };

    const calendar = generateCalendar(current.year, current.month);

    // ========== Cambia mese ==========
    const nextMonth = () =>
        setCurrent((p) =>
            p.month === 11
                ? { year: p.year + 1, month: 0 }
                : { ...p, month: p.month + 1 }
        );

    const prevMonth = () =>
        setCurrent((p) =>
            p.month === 0
                ? { year: p.year - 1, month: 11 }
                : { ...p, month: p.month - 1 }
        );

    // ========== Formatta data (evita bug UTC) ==========
    const formatDate = (d) =>
        [
            d.getFullYear(),
            String(d.getMonth() + 1).padStart(2, '0'),
            String(d.getDate()).padStart(2, '0'),
        ].join('-');

    // ========== Click giorno ==========
    const handleSelect = (day) => {
        if (!day) return;
        const d = new Date(current.year, current.month, day);

        if (disablePast && d < todayStart) return;

        form?.setFieldValue(name, formatDate(d));
        setOpen(false);
    };

    // ========== Controllo se è passato ==========
    const isPast = (day) => {
        const d = new Date(current.year, current.month, day);
        return d < todayStart;
    };

    // ========== Per evidenziare il giorno corrente nel calendario ==========
    const isToday = (day) => {
        const d = new Date(current.year, current.month, day);
        return (
            d.getFullYear() === today.getFullYear() &&
            d.getMonth() === today.getMonth() &&
            d.getDate() === today.getDate()
        );
    };

    return (
        <div
            ref={wrapperRef}
            className={`relative flex flex-col gap-1 ${className}`}
        >
            {/* INPUT */}
            <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                className={`
                    input-default h-[38px] w-full pr-10 text-left
                    ${error ? 'border-brand-error' : 'border-brand-divider'}
                `}
            >
                {selectedValue || (
                    <span className="text-brand-textSecondary">
                        {placeholder}
                    </span>
                )}
                <span className="absolute right-3 top-1/2 -translate-y-1/2 opacity-70">
                    📅
                </span>
            </button>

            {/* Error */}
            {error && (
                <span className="text-brand-error text-sm animate-fadeIn">
                    {error}
                </span>
            )}

            {/* CALENDAR OVERLAY */}
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

                    {/* Giorni settimana */}
                    <div className="grid grid-cols-7 text-center text-sm font-semibold text-brand-textSecondary mb-1">
                        <div>L</div>
                        <div>M</div>
                        <div>M</div>
                        <div>G</div>
                        <div>V</div>
                        <div>S</div>
                        <div>D</div>
                    </div>

                    {/* Giorni */}
                    <div className="grid grid-cols-7 text-center">
                        {calendar.flat().map((day, idx) => {
                            if (!day)
                                return (
                                    <div key={idx} className="py-2 mx-[2px]" />
                                );

                            const disabled = disablePast && isPast(day);
                            const selected =
                                selectedValue &&
                                parseInt(selectedValue.split('-')[2]) === day &&
                                parseInt(selectedValue.split('-')[1]) - 1 ===
                                    current.month &&
                                parseInt(selectedValue.split('-')[0]) ===
                                    current.year;
                            const todayCell = isToday(day);

                            return (
                                <div
                                    key={idx}
                                    onClick={() =>
                                        !disabled && handleSelect(day)
                                    }
                                    className={`
                                        py-[6px] mx-[2px]
                                        flex items-center justify-center
                                        rounded-[6px]
                                        select-none transition-all duration-150 cursor-pointer
                                    
                                        ${
                                            disabled
                                                ? 'text-black/30 bg-black/5 pointer-events-none'
                                                : ''
                                        }
                                    
                                        ${
                                            selected
                                                ? 'bg-brand-primary text-white font-semibold'
                                                : todayCell
                                                ? 'text-brand-primary font-bold'
                                                : 'hover:bg-brand-primary/10 hover:scale-[1.05]'
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
    );
}

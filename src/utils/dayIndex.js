export function dayIndexToWeekDay(dayIndex) {
    const idx = Number(dayIndex ?? 0);
    const settimana = Math.floor(idx / 7) + 1; // 1..4
    const giorno = (idx % 7) + 1; // 1..7
    return { settimana: String(settimana), giorno: String(giorno) };
}

export function weekDayToDayIndex(settimana, giorno) {
    const w = Number(settimana);
    const d = Number(giorno);
    if (!w || !d) return null;
    return (w - 1) * 7 + (d - 1); // 0..27
}

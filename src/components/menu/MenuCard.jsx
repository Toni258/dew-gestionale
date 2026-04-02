// Card component used for menu.
import { useNavigate } from 'react-router-dom';
import { capitalize } from '../../utils/capitalize';

function formatMenuDate(value) {
    const raw = String(value ?? '').trim();
    if (!raw) return '—';

    const parts = raw.split('-');
    if (parts.length !== 3) return raw;

    return `${parts[2]}.${parts[1]}.${parts[0]}`;
}

export default function MenuCard({ menu, onArchive }) {
    const navigate = useNavigate();

    const {
        season_type,
        day_number,
        start_date,
        end_date,
        is_active,
        is_ended,
        meals_completed,
        meals_total,
    } = menu;

    const mealsCompletedClass =
        meals_completed == meals_total
            ? 'text-brand-primary'
            : 'text-brand-error';

    return (
        <div
            className="menu-card cursor-pointer"
            role="button"
            tabIndex={0}
            onClick={() =>
                navigate(`/menu/edit/${encodeURIComponent(season_type)}`)
            }
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    navigate(`/menu/edit/${encodeURIComponent(season_type)}`);
                }
            }}
        >
            {/* COLONNA STATO */}
            <div className="flex-[1]">
                <div className="flex flex-col items-center justify-center h-full">
                    <span className="mb-3 font-semibold text-xl">Stato</span>
                    <span
                        className={`w-5 h-5 rounded-full inline-block ${
                            is_active
                                ? 'bg-green-500'
                                : is_ended
                                  ? 'bg-gray-500'
                                  : 'bg-red-500'
                        }`}
                    />
                </div>
            </div>

            {/* Divider */}
            <div className="menu-card__divider" />

            {/* CONTENUTO */}
            <div className="flex-[4]">
                <div className="flex flex-col h-full">
                    <span className="text-2xl font-semibold mb-4">
                        {capitalize(season_type)}
                    </span>

                    <div className="flex flex-col gap-2 lg:flex-row">
                        <span className="flex flex-[1] text-lg text-brand-text gap-2">
                            Giorno del pasto:
                            <span className="text-brand-primary font-semibold">
                                {day_number}
                            </span>
                        </span>

                        <span className="flex flex-[2] text-lg text-brand-text gap-2">
                            Inizio:
                            <span className="text-brand-primary font-semibold">
                                {formatMenuDate(start_date)}
                            </span>
                        </span>
                    </div>

                    <div className="mt-1 flex flex-col gap-2 lg:flex-row">
                        <span className="flex flex-[1] text-lg text-brand-text gap-2">
                            Pasti compilati:
                            <span
                                className={`font-semibold ${mealsCompletedClass}`}
                            >
                                {meals_completed}/{meals_total}
                            </span>
                        </span>

                        <span className="flex flex-[2] text-lg text-brand-text gap-2">
                            Fine:
                            <span className="text-brand-primary font-semibold">
                                {formatMenuDate(end_date)}
                            </span>
                        </span>
                    </div>
                </div>
            </div>

            {/* AZIONI / CHEVRON */}
            <div className="flex flex-[1] items-center justify-start lg:justify-center">
                {is_ended ? (
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            onArchive?.(menu);
                        }}
                        onKeyDown={(e) => {
                            e.stopPropagation();
                        }}
                        className="rounded-lg bg-brand-primary px-6 py-4 font-semibold text-white transition hover:opacity-90"
                    >
                        Archivia
                    </button>
                ) : (
                    <div className="pointer-events-none">
                        <img
                            src="/icons/Chevron destra secondario.png"
                            alt="Apri menù"
                            className="w-10 h-10 select-none opacity-60"
                            draggable={false}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}

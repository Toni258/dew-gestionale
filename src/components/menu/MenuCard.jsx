import { useNavigate } from 'react-router-dom';

export default function MenuCard({ menu }) {
    const navigate = useNavigate();

    const {
        season_type,
        day_number,
        period_label,
        start_year,
        is_active,
        meals_completed,
        meals_total,
    } = menu;

    const mealsCompletedClass =
        meals_completed === meals_total ? 'text-green-600' : 'text-red-600';

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
                            is_active ? 'bg-green-500' : 'bg-red-500'
                        }`}
                    />
                </div>
            </div>

            {/* Divider */}
            <div className="w-[1px] bg-brand-divider ml-2 mr-6" />

            {/* CONTENUTO */}
            <div className="flex-[7]">
                <div className="flex flex-col h-full">
                    <span className="text-2xl font-semibold mb-4">
                        {season_type}
                    </span>

                    <div className="flex">
                        <span className="flex flex-[1] text-lg text-brand-text gap-2">
                            Giorno del pasto:
                            <span className="text-brand-primary font-semibold">
                                {day_number}
                            </span>
                        </span>

                        <span className="flex flex-[2] text-lg text-brand-text gap-2">
                            Periodo:
                            <span className="text-brand-primary font-semibold">
                                {period_label}
                            </span>
                        </span>
                    </div>

                    <div className="flex mt-1">
                        <span className="flex flex-[1] text-lg text-brand-text gap-2">
                            Anno:
                            <span className="text-brand-primary font-semibold">
                                {start_year}
                            </span>
                        </span>

                        <span className="flex flex-[2] text-lg text-brand-text gap-2">
                            Pasti compilati:
                            <span
                                className={`font-semibold ${mealsCompletedClass}`}
                            >
                                {meals_completed}/{meals_total}
                            </span>
                        </span>
                    </div>
                </div>
            </div>

            {/* CHEVRON */}
            <div className="flex flex-[1] items-center justify-center">
                <div className="pointer-events-none">
                    <img
                        src="/Chevron destra secondario.png"
                        alt="Apri menù"
                        className="w-10 h-10 select-none opacity-60"
                        draggable={false}
                    />
                </div>
            </div>
        </div>
    );
}

// Card component used for archived menu.
import { useNavigate } from 'react-router-dom';
import { capitalize } from '../../utils/capitalize';

export default function ArchivedMenuCard({ menu }) {
    const navigate = useNavigate();

    const {
        id_arch_menu,
        season_type,
        start_date,
        end_date,
        start_year,
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
                navigate(
                    `/menu-archived/view-archived/${encodeURIComponent(id_arch_menu)}`,
                )
            }
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    navigate(
                        `/menu-archived/view-archived/${encodeURIComponent(id_arch_menu)}`,
                    );
                }
            }}
        >
            {/* CONTENUTO */}
            <div className="flex-[6] ml-10">
                <div className="flex flex-col h-full">
                    <span className="text-2xl font-semibold mb-4">
                        {capitalize(season_type)}
                    </span>

                    <div className="flex">
                        <span className="flex flex-[1] text-lg text-brand-text gap-2">
                            Inizio:
                            <span className="text-brand-primary font-semibold">
                                {start_date}
                            </span>
                        </span>

                        <span className="flex flex-[2] text-lg text-brand-text gap-2">
                            Fine:
                            <span className="text-brand-primary font-semibold">
                                {end_date}
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
                        src="/icons/Chevron destra secondario.png"
                        alt="Apri menù"
                        className="w-10 h-10 select-none opacity-60"
                        draggable={false}
                    />
                </div>
            </div>
        </div>
    );
}

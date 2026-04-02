// Card component used for menu header.
import Card from '../ui/Card';
import { capitalize } from '../../utils/capitalize';

export default function MenuHeaderCard({
    menu,
    onClickFixedDishes,
    onClickEditMenu,
    onClickDeleteMenu,
}) {
    return (
        <Card className="mt-6 flex flex-col gap-6 !p-6 xl:flex-row xl:items-stretch">
            <div className="flex flex-[1] flex-col items-center justify-center text-lg text-brand-text gap-1">
                <span>Giorno del menù</span>
                <span className="text-brand-primary font-semibold">
                    {menu.day_index + 1}
                </span>
            </div>

            <div className="hidden w-px bg-brand-divider xl:block" />

            <div className="flex flex-[3] flex-col gap-3 justify-center">
                <div className="flex text-lg text-brand-text gap-2">
                    <span>Nome:</span>
                    <span className="text-brand-primary font-semibold">
                        {capitalize(menu.season_type)}
                    </span>
                </div>

                <div className="flex flex-col gap-2 text-lg text-brand-text lg:flex-row lg:gap-4">
                    <div className="flex flex-1 flex-col gap-1 sm:flex-row">
                        <span>Data inizio:</span>
                        <span className="text-brand-primary font-semibold">
                            {menu.start_date}
                        </span>
                    </div>

                    <div className="flex flex-1 flex-col gap-1 sm:flex-row">
                        <span>Data fine:</span>
                        <span className="text-brand-primary font-semibold">
                            {menu.end_date}
                        </span>
                    </div>
                </div>
            </div>

            <div className="hidden w-px bg-brand-divider xl:block" />

            <div className="flex flex-[1] flex-col items-start justify-center gap-2 text-lg font-semibold sm:items-center">
                <span>Piatti fissi</span>
                <button
                    type="button"
                    className="flex py-2 bg-[#F5C542] rounded-[6px] w-[100px] justify-center"
                    onClick={onClickFixedDishes}
                >
                    <img
                        src="/icons/edit bianco.png"
                        alt="Modifica piatti fissi"
                        className="w-5 h-5 select-none opacity-60"
                        draggable={false}
                    />
                </button>
            </div>

            <div className="hidden w-px bg-brand-divider xl:block" />

            <div className="flex flex-[1] flex-col items-start justify-center gap-2 text-lg font-semibold sm:items-center">
                <span>Azioni</span>
                <div className="flex items-center">
                    <button
                        className="rounded-md bg-brand-warning/25 p-1.5"
                        onClick={onClickEditMenu}
                        type="button"
                    >
                        <img
                            src="/icons/pencil-giallo.png"
                            alt="Modifica"
                            className="h-5 w-5 shrink-0"
                            draggable={false}
                        />
                    </button>

                    <button
                        className="ml-4 rounded-md bg-brand-error/25 p-1.5"
                        onClick={onClickDeleteMenu}
                        type="button"
                    >
                        <img
                            src="/icons/delete-1-rosso.png"
                            alt="Elimina"
                            className="h-5 w-5 shrink-0"
                            draggable={false}
                        />
                    </button>
                </div>
            </div>
        </Card>
    );
}

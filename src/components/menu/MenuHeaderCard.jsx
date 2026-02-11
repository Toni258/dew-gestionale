import Card from '../ui/Card';
import { capitalize } from '../../utils/capitalize';

export default function MenuHeaderCard({
    menu,
    onClickFixedDishes,
    onClickEditMenu,
    onClickDeleteMenu,
}) {
    return (
        <Card className="flex mt-6 !p-6">
            <div className="flex flex-[1] flex-col items-center justify-center text-lg text-brand-text gap-1">
                <span>Giorno del menù</span>
                <span className="text-brand-primary font-semibold">
                    {menu.day_index + 1}
                </span>
            </div>

            <div className="w-[1px] bg-brand-divider ml-2 mr-6" />

            <div className="flex flex-[5] flex-col gap-2 justify-center">
                <div className="flex text-lg text-brand-text gap-2">
                    <span>Nome:</span>
                    <span className="text-brand-primary font-semibold">
                        {capitalize(menu.season_type)}
                    </span>
                </div>

                <div className="flex text-lg text-brand-text gap-2">
                    <div className="flex flex-[1] gap-1">
                        <span>Data inizio:</span>
                        <span className="text-brand-primary font-semibold">
                            {menu.start_date}
                        </span>
                    </div>

                    <div className="flex flex-[1] gap-1">
                        <span>Data fine:</span>
                        <span className="text-brand-primary font-semibold">
                            {menu.end_date}
                        </span>
                    </div>
                </div>
            </div>

            <div className="w-[1px] bg-brand-divider ml-2 mr-6" />

            <div className="flex flex-[1] flex-col justify-center items-center gap-2 text-lg font-semibold">
                <span>Piatti fissi</span>
                <button
                    type="button"
                    className="flex py-2 bg-[#F5C542] rounded-[6px] w-[100px] justify-center"
                    onClick={onClickFixedDishes}
                >
                    <img
                        src="/edit bianco.png"
                        alt="Modifica piatti fissi"
                        className="w-5 h-5 select-none opacity-60"
                        draggable={false}
                    />
                </button>
            </div>

            <div className="w-[1px] bg-brand-divider ml-6 mr-6" />

            <div className="flex flex-[1] flex-col justify-center items-center gap-2 text-lg font-semibold">
                <span>Azioni</span>
                <div className="flex gap-4">
                    <button
                        className="text-brand-primary font-semibold"
                        onClick={onClickEditMenu}
                        type="button"
                    >
                        ✏
                    </button>

                    <button
                        className="ml-3 text-red-500"
                        onClick={onClickDeleteMenu}
                        type="button"
                    >
                        🗑
                    </button>
                </div>
            </div>
        </Card>
    );
}

// Card component used for archived menu header.
import Card from '../ui/Card';
import { capitalize } from '../../utils/capitalize';

export default function ArchivedMenuHeaderCard({ menu, onClickFixedDishes }) {
    return (
        <Card className="flex mt-6 !pl-10">
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
                    className="flex py-2 bg-brand-primary rounded-md w-[100px] justify-center"
                    onClick={onClickFixedDishes}
                >
                    <img
                        src="/eye white.png"
                        alt="Modifica piatti fissi"
                        className="w-6 h-6 select-none"
                        draggable={false}
                    />
                </button>
            </div>
        </Card>
    );
}
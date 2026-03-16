// Card component used for archived menu header.
import Card from '../ui/Card';
import { capitalize } from '../../utils/capitalize';

export default function ArchivedMenuHeaderCard({ menu, onClickFixedDishes }) {
    return (
        <Card className="mt-6 flex flex-col gap-6 !p-6 xl:flex-row xl:items-stretch">
            <div className="flex flex-[5] flex-col gap-3 justify-center">
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
                    className="flex py-2 bg-brand-primary rounded-md w-[100px] justify-center"
                    onClick={onClickFixedDishes}
                >
                    <img
                        src="/icons/eye white.png"
                        alt="Modifica piatti fissi"
                        className="w-6 h-6 select-none"
                        draggable={false}
                    />
                </button>
            </div>
        </Card>
    );
}

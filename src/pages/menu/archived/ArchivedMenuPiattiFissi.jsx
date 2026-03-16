// Main page for archived menu piatti fissi.
import AppLayout from '../../../components/layout/AppLayout';
import { useParams, useNavigate } from 'react-router-dom';

import Button from '../../../components/ui/Button';
import FixedDishesGrid from '../../../components/menu/fixedDishes/FixedDishesGrid';
import { useArchivedFixedDishesMenu } from '../../../hooks/menus/useArchivedFixedDishesMenu';
import { withLoaderNotify } from '../../../services/withLoaderNotify';

export default function ArchivedMenuPiattiFissi() {
    const { id_arch_menu } = useParams();
    const navigate = useNavigate();

    const { loading, selectedFoods, cheeseRotation } =
        useArchivedFixedDishesMenu(id_arch_menu);

    if (loading) {
        return (
            <AppLayout title="MENÙ ARCHIVIATI">
                <h1 className="text-3xl font-semibold">
                    Piatti fissi (archiviato)
                </h1>
                <div className="mx-0 my-6 overflow-x-auto">Caricamento…</div>
            </AppLayout>
        );
    }

    return (
        <AppLayout title="MENÙ ARCHIVIATI">
            <div className="w-full max-w-7xl mx-auto">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <h1 className="text-3xl font-semibold">
                        Piatti fissi (archiviato)
                    </h1>

                    <div className="hidden sm:block text-sm text-gray-500">
                        Solo visualizzazione
                    </div>
                </div>

                <div className="mx-4 my-6">
                    <FixedDishesGrid
                        readOnly
                        loading={false}
                        options={{ pranzo: {}, cena: {} }} // non servono in readOnly
                        selectedFoods={selectedFoods}
                        cheeseOptions={[]} // non serve
                        cheeseRotation={cheeseRotation}
                        cheeseFilled={true}
                        onSelectFood={() => ({ ok: false })}
                        onChangeCheeseAt={() => {}}
                    />
                </div>

                <div className="mx-0 mb-10 mt-2 flex flex-col justify-center gap-4 sm:flex-row sm:gap-8">
                    <Button
                        variant="secondary"
                        size="lg"
                        className="w-full sm:w-[240px]"
                        onClick={() => navigate(-1)}
                    >
                        Indietro
                    </Button>
                </div>
            </div>
        </AppLayout>
    );
}

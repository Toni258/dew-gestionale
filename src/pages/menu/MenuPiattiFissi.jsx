// Main page for menu piatti fissi.
import AppLayout from '../../components/layout/AppLayout';
import { useParams, useNavigate } from 'react-router-dom';

import Button from '../../components/ui/Button';
import FixedDishesGrid from '../../components/menu/fixedDishes/FixedDishesGrid';
import { useFixedDishesMenu } from '../../hooks/menus/useFixedDishesMenu';
import { withLoaderNotify } from '../../services/withLoaderNotify';

export default function MenuPiattiFissi() {
    const { seasonType } = useParams();
    const navigate = useNavigate();

    const {
        decodedSeasonType,

        loading,
        saving,

        options,
        selectedFoods,

        cheeseOptions,
        cheeseRotation,
        cheeseFilled,

        allFilled,

        setSelectedFood,
        setCheeseRotationAt,

        save,
    } = useFixedDishesMenu(seasonType);

    // Handles the logic for save.
    async function handleSave() {
        const res = await withLoaderNotify({
            message: 'Salvataggio piatti fissi…',
            mode: 'blocking',
            success: 'Piatti fissi salvati correttamente',
            errorTitle: 'Errore salvataggio',
            errorMessage: 'Impossibile salvare i piatti fissi.',
            fn: async () => {
                const r = await save();
                if (!r.ok) throw new Error(r.message || 'Errore salvataggio');
                return r;
            },
        });

        if (!res.ok) return;

        navigate(`/menu/edit/${decodedSeasonType}`);
    }

    if (loading) {
        return (
            <AppLayout title="GESTIONE MENÙ">
                <h1 className="text-3xl font-semibold">Scelta piatti fissi</h1>
                <div className="mx-0 my-6 overflow-x-auto">Caricamento…</div>
            </AppLayout>
        );
    }

    return (
        <AppLayout title="GESTIONE MENÙ">
            <div className="w-full max-w-7xl mx-auto">
                <h1 className="text-3xl font-semibold">
                    Scelta piatti fissi
                </h1>

                <div className="mx-4 my-6">
                    <FixedDishesGrid
                        loading={loading}
                        options={options}
                        selectedFoods={selectedFoods}
                        cheeseOptions={cheeseOptions}
                        cheeseRotation={cheeseRotation}
                        cheeseFilled={cheeseFilled}
                        onSelectFood={setSelectedFood}
                        onChangeCheeseAt={setCheeseRotationAt}
                    />
                </div>

                <div className="mx-0 mb-10 mt-2 flex flex-col justify-center gap-4 sm:flex-row sm:gap-8">
                    <Button
                        variant="secondary"
                        size="lg"
                        className="w-full sm:w-[240px]"
                        onClick={() =>
                            navigate(`/menu/edit/${decodedSeasonType}`)
                        }
                    >
                        Indietro
                    </Button>

                    <Button
                        variant="primary"
                        size="lg"
                        className="w-[240px]"
                        disabled={saving || !allFilled}
                        onClick={handleSave}
                    >
                        {saving ? 'Salvataggio...' : 'Salva piatti fissi'}
                    </Button>
                </div>
            </div>
        </AppLayout>
    );
}

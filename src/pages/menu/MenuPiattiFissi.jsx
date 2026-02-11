import AppLayout from '../../components/layout/AppLayout';
import { useParams, useNavigate } from 'react-router-dom';

import Button from '../../components/ui/Button';
import FixedDishesGrid from '../../components/menu/fixedDishes/FixedDishesGrid';
import { useFixedDishesMenu } from '../../hooks/menus/useFixedDishesMenu';

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

    async function handleSave() {
        const res = await save();
        if (!res.ok) {
            alert(res.message || 'Errore salvataggio');
            return;
        }
        alert('Piatti fissi salvati correttamente');
        navigate(`/menu/edit/${decodedSeasonType}`);
    }

    if (loading) {
        return (
            <AppLayout title="GESTIONE MENÙ" username="Antonio">
                <h1 className="text-3xl font-semibold">Scelta piatti fissi</h1>
                <div className="mx-4 my-6">Caricamento…</div>
            </AppLayout>
        );
    }

    return (
        <AppLayout title="GESTIONE MENÙ" username="Antonio">
            <h1 className="text-3xl font-semibold">Scelta piatti fissi</h1>

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

            <div className="flex justify-center mx-4 mt-2 mb-10 gap-8">
                <Button
                    variant="secondary"
                    size="lg"
                    className="w-[240px]"
                    onClick={() => navigate(`/menu/edit/${decodedSeasonType}`)}
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
        </AppLayout>
    );
}

// Main page for archived menu piatti fissi.
import AppLayout from '../../../components/layout/AppLayout';
import { useParams, useNavigate } from 'react-router-dom';

import Button from '../../../components/ui/Button';
import AlertBox from '../../../components/ui/AlertBox';
import ResourceNotFoundState from '../../../components/ui/ResourceNotFoundState';
import FixedDishesGrid from '../../../components/menu/fixedDishes/FixedDishesGrid';
import { useArchivedFixedDishesMenu } from '../../../hooks/menus/useArchivedFixedDishesMenu';

export default function ArchivedMenuPiattiFissi() {
    const { id_arch_menu } = useParams();
    const navigate = useNavigate();

    const { loading, error, notFound, selectedFoods, cheeseRotation } =
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

    if (notFound) {
        return (
            <AppLayout title="MENÙ ARCHIVIATI">
                <ResourceNotFoundState
                    title="Menù archiviato non trovato"
                    description="I piatti fissi richiesti non sono disponibili perché il menù archiviato non esiste più oppure il collegamento non è valido."
                    requestedLabel="ID archivio richiesto"
                    requestedValue={id_arch_menu}
                    note="Il menù archiviato potrebbe essere stato rimosso dallo storico oppure il link potrebbe puntare a una risorsa non più disponibile."
                    secondaryLabel="Vai allo storico menù"
                    onSecondaryClick={() => navigate('/menu-archived/history')}
                />
            </AppLayout>
        );
    }

    if (error) {
        return (
            <AppLayout title="MENÙ ARCHIVIATI">
                <div className="w-full max-w-2xl mx-auto">
                    <AlertBox variant="error" title="Impossibile caricare i piatti fissi archiviati">
                        {error?.message || 'Si è verificato un errore inatteso durante il caricamento.'}
                    </AlertBox>

                    <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:justify-center">
                        <Button
                            variant="secondary"
                            className="w-full sm:w-[220px]"
                            onClick={() => navigate('/menu-archived/history')}
                        >
                            Vai allo storico menù
                        </Button>

                        <Button
                            variant="primary"
                            className="w-full sm:w-[220px]"
                            onClick={() => navigate(-1)}
                        >
                            Torna indietro
                        </Button>
                    </div>
                </div>
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
                        options={{ pranzo: {}, cena: {} }}
                        selectedFoods={selectedFoods}
                        cheeseOptions={[]}
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

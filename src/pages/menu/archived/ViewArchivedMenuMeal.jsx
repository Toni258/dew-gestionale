// Main page for view archived menu meal.
import AppLayout from '../../../components/layout/AppLayout';
import { useNavigate, useParams } from 'react-router-dom';
import { dayIndexToWeekDay } from '../../../utils/dayIndex';

import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import AlertBox from '../../../components/ui/AlertBox';
import ResourceNotFoundState from '../../../components/ui/ResourceNotFoundState';

import MenuMealHeader from '../../../components/menu/MenuMealHeader';
import MenuMealCourseRow from '../../../components/menu/MenuMealCourseRow';
import MenuMealTotalsCard from '../../../components/menu/MenuMealTotalsCard';

import { useViewArchivedMenuMeal } from '../../../hooks/menus/useViewArchivedMenuMeal';

export default function ViewArchivedMenuMeal() {
    const navigate = useNavigate();
    const { id_arch_menu, dayIndex, mealType } = useParams();

    const { settimana, giorno } = dayIndexToWeekDay(dayIndex);

    const {
        COURSE_TYPES,
        data,
        loading,
        error,
        notFound,
        selectedFoods,
        totals,
        pageLabel,
    } = useViewArchivedMenuMeal({ id_arch_menu, dayIndex, mealType });

    const requestedMealLabel = [id_arch_menu, dayIndex, mealType]
        .filter(Boolean)
        .join(' / ');

    if (loading) {
        return (
            <AppLayout title="MENÙ ARCHIVIATI">
                <p>Caricamento…</p>
            </AppLayout>
        );
    }

    if (notFound || (!data && !error)) {
        return (
            <AppLayout title="MENÙ ARCHIVIATI">
                <ResourceNotFoundState
                    title="Pasto archiviato non disponibile"
                    description="Il pasto richiesto non è disponibile perché il menù archiviato non esiste più oppure il link non è valido."
                    requestedLabel="Risorsa richiesta"
                    requestedValue={requestedMealLabel}
                    note="Il menù archiviato potrebbe essere stato rimosso dallo storico oppure il link potrebbe contenere parametri non più validi."
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
                    <AlertBox variant="error" title="Impossibile caricare il pasto archiviato">
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
            <div className="w-full max-w-4xl mx-auto">
                <MenuMealHeader
                    pageLabel={pageLabel}
                    giorno={giorno}
                    settimana={settimana}
                    mealType={mealType}
                />

                <Card className="mt-6 p-6">
                    <div className="flex flex-col gap-5">
                        {COURSE_TYPES.map((course, idx) => (
                            <MenuMealCourseRow
                                key={course.key}
                                course={course}
                                selectedFood={selectedFoods[course.key]}
                                showDivider={idx < COURSE_TYPES.length - 1}
                                readOnly
                            />
                        ))}

                        <MenuMealTotalsCard totals={totals} />

                        <div className="flex justify-center gap-8">
                            <Button
                                variant="secondary"
                                className="px-5 py-2 mb-[-10px]"
                                onClick={() =>
                                    navigate(
                                        `/menu-archived/view-archived/${id_arch_menu}`,
                                    )
                                }
                            >
                                Indietro
                            </Button>
                        </div>
                    </div>
                </Card>
            </div>
        </AppLayout>
    );
}

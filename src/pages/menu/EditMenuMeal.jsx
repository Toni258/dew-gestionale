// Main page for edit menu meal.
import AppLayout from '../../components/layout/AppLayout';
import { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { dayIndexToWeekDay } from '../../utils/dayIndex';

import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import AlertBox from '../../components/ui/AlertBox';
import ResourceNotFoundState from '../../components/ui/ResourceNotFoundState';

import { useEditMenuMeal } from '../../hooks/menus/useEditMenuMeal';

import MenuMealHeader from '../../components/menu/MenuMealHeader';
import MenuMealCourseRow from '../../components/menu/MenuMealCourseRow';
import MenuMealTotalsCard from '../../components/menu/MenuMealTotalsCard';
import WarnIncompleteMealModal from '../../components/modals/WarnIncompleteMealModal';

import { withLoaderNotify } from '../../services/withLoaderNotify';

export default function EditMenuMeal() {
    const navigate = useNavigate();
    const { seasonType, dayIndex, mealType } = useParams();

    const { settimana, giorno } = dayIndexToWeekDay(dayIndex);
    const [showIncompleteMealModal, setShowIncompleteMealModal] =
        useState(false);

    const {
        COURSE_TYPES,
        data,
        loading,
        saving,
        error,
        notFound,
        foodOptions,
        selectedFoods,
        pageLabel,
        buttonLabel,
        disableSave,
        totals,
        setSelectedFood,
        save,
    } = useEditMenuMeal({ seasonType, dayIndex, mealType });
    // Derived data used by the UI

    const missingCourses = useMemo(() => {
        return COURSE_TYPES.filter(
            (course) => !selectedFoods[course.key]?.id_food,
        ).map((course) => course.label.toLowerCase());
    }, [COURSE_TYPES, selectedFoods]);

    const requestedMealLabel = [seasonType, dayIndex, mealType]
        .filter(Boolean)
        .join(' / ');

    // Handles the logic for confirm save.
    async function handleConfirmSave() {
        const result = await withLoaderNotify({
            message: 'Salvataggio…',
            mode: 'blocking',
            success: 'Menù salvato correttamente',
            errorTitle: 'Errore salvataggio',
            errorMessage: 'Impossibile salvare le modifiche.',
            fn: async () => {
                const response = await save();
                if (!response?.ok) {
                    throw new Error(response?.message || 'Errore salvataggio');
                }
                return response;
            },
        });

        if (!result.ok) return;

        setShowIncompleteMealModal(false);
        navigate(`/menu/edit/${seasonType}`);
    }

    if (loading) {
        return (
            <AppLayout title="GESTIONE MENÙ">
                <p>Caricamento…</p>
            </AppLayout>
        );
    }

    if (notFound || (!data && !error)) {
        return (
            <AppLayout title="GESTIONE MENÙ">
                <ResourceNotFoundState
                    title="Pasto non disponibile"
                    description="Il pasto richiesto non esiste più oppure il menù a cui appartiene non è disponibile."
                    requestedLabel="Risorsa richiesta"
                    requestedValue={requestedMealLabel}
                    note="Il menù potrebbe essere stato eliminato oppure il link potrebbe contenere parametri non più validi."
                    secondaryLabel="Vai all'elenco menù"
                    onSecondaryClick={() => navigate('/menu')}
                />
            </AppLayout>
        );
    }

    if (error) {
        return (
            <AppLayout title="GESTIONE MENÙ">
                <div className="w-full max-w-2xl mx-auto">
                    <AlertBox variant="error" title="Impossibile caricare il pasto">
                        {error?.message || 'Si è verificato un errore inatteso durante il caricamento.'}
                    </AlertBox>

                    <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:justify-center">
                        <Button
                            variant="secondary"
                            className="w-full sm:w-[220px]"
                            onClick={() => navigate('/menu')}
                        >
                            Vai all'elenco menù
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
        <AppLayout title="GESTIONE MENÙ">
            <div className="w-full max-w-5xl mx-auto">
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
                                valueId={selectedFoods[course.key]?.id_food}
                                options={foodOptions[course.key]}
                                selectedFood={selectedFoods[course.key]}
                                onChange={(idStr) =>
                                    setSelectedFood(course.key, idStr)
                                }
                                showDivider={idx < COURSE_TYPES.length - 1}
                            />
                        ))}

                        <MenuMealTotalsCard totals={totals} />

                        <div className="flex justify-center gap-8">
                            <Button
                                variant="secondary"
                                className="px-5 py-2 mb-[-10px]"
                                onClick={() =>
                                    navigate(`/menu/edit/${seasonType}`)
                                }
                                disabled={saving}
                            >
                                Indietro
                            </Button>

                            <Button
                                className="px-5 py-2 mb-[-10px]"
                                onClick={async () => {
                                    if (missingCourses.length > 0) {
                                        setShowIncompleteMealModal(true);
                                        return;
                                    }

                                    await handleConfirmSave();
                                }}
                                disabled={disableSave}
                            >
                                {saving ? 'Salvataggio...' : buttonLabel}
                            </Button>
                        </div>
                    </div>
                </Card>
            </div>

            <WarnIncompleteMealModal
                show={showIncompleteMealModal}
                missingCourses={missingCourses}
                saving={saving}
                onClose={() => setShowIncompleteMealModal(false)}
                onConfirm={handleConfirmSave}
            />
        </AppLayout>
    );
}

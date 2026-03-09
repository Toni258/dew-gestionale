import AppLayout from '../../components/layout/AppLayout';
import { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { dayIndexToWeekDay } from '../../utils/dayIndex';

import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';

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
        foodOptions,
        selectedFoods,
        pageLabel,
        buttonLabel,
        disableSave,
        totals,
        setSelectedFood,
        save,
    } = useEditMenuMeal({ seasonType, dayIndex, mealType });

    const missingCourses = useMemo(() => {
        return COURSE_TYPES.filter(
            (course) => !selectedFoods[course.key]?.id_food,
        ).map((course) => course.label.toLowerCase());
    }, [COURSE_TYPES, selectedFoods]);

    async function handleConfirmSave() {
        const result = await withLoaderNotify({
            message: 'Salvataggio…',
            mode: 'blocking',
            success: 'Menù salvato correttamente',
            errorTitle: 'Errore salvataggio',
            errorMessage: 'Impossibile salvare le modifiche.',
            fn: async () => {
                const r = await save();
                if (!r?.ok) {
                    throw new Error(r?.message || 'Errore salvataggio');
                }
                return r;
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

    if (!data) {
        return (
            <AppLayout title="GESTIONE MENÙ">
                <p>Errore</p>
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

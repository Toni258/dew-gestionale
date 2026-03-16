// Main page for view archived menu meal.
import AppLayout from '../../../components/layout/AppLayout';
import { useNavigate, useParams } from 'react-router-dom';
import { dayIndexToWeekDay } from '../../../utils/dayIndex';

import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';

import MenuMealHeader from '../../../components/menu/MenuMealHeader';
import MenuMealCourseRow from '../../../components/menu/MenuMealCourseRow';
import MenuMealTotalsCard from '../../../components/menu/MenuMealTotalsCard';

import { useViewArchivedMenuMeal } from '../../../hooks/menus/useViewArchivedMenuMeal';

export default function ViewArchivedMenuMeal() {
    const navigate = useNavigate();
    const { id_arch_menu, dayIndex, mealType } = useParams();

    const { settimana, giorno } = dayIndexToWeekDay(dayIndex);

    const { COURSE_TYPES, data, loading, selectedFoods, totals, pageLabel } =
        useViewArchivedMenuMeal({ id_arch_menu, dayIndex, mealType });

    if (loading) {
        return (
            <AppLayout title="MENÙ ARCHIVIATI">
                <p>Caricamento…</p>
            </AppLayout>
        );
    }

    if (!data) {
        return (
            <AppLayout title="MENÙ ARCHIVIATI">
                <p>Errore</p>
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
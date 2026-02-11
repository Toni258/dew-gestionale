import AppLayout from '../../components/layout/AppLayout';
import { useParams, useNavigate } from 'react-router-dom';
import { dayIndexToWeekDay } from '../../utils/dayIndex';

import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';

import { useEditMenuMeal } from '../../hooks/menus/useEditMenuMeal';

import MenuMealHeader from '../../components/menu/MenuMealHeader';
import MenuMealCourseRow from '../../components/menu/MenuMealCourseRow';
import MenuMealTotalsCard from '../../components/menu/MenuMealTotalsCard';

export default function EditMenuMeal() {
    const navigate = useNavigate();
    const { seasonType, dayIndex, mealType } = useParams();

    const { settimana, giorno } = dayIndexToWeekDay(dayIndex);

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

    if (loading) {
        return (
            <AppLayout title="GESTIONE MENÙ" username="Antonio">
                <p>Caricamento…</p>
            </AppLayout>
        );
    }

    if (!data) {
        return (
            <AppLayout title="GESTIONE MENÙ" username="Antonio">
                <p>Errore</p>
            </AppLayout>
        );
    }

    return (
        <AppLayout title="GESTIONE MENÙ" username="Antonio">
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
                            onClick={() => navigate(`/menu/edit/${seasonType}`)}
                            disabled={saving}
                        >
                            Indietro
                        </Button>

                        <Button
                            className="px-5 py-2 mb-[-10px]"
                            onClick={async () => {
                                const res = await save();
                                if (res.ok)
                                    navigate(`/menu/edit/${seasonType}`);
                            }}
                            disabled={disableSave}
                        >
                            {saving ? 'Salvataggio...' : buttonLabel}
                        </Button>
                    </div>
                </div>
            </Card>
        </AppLayout>
    );
}

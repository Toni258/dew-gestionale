import AppLayout from '../../components/layout/AppLayout';
import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { dayIndexToWeekDay } from '../../utils/dayIndex';
import { capitalize } from '../../utils/capitalize';

import Card from '../../components/ui/Card';
import FormGroup from '../../components/ui/FormGroup';
import SearchableSelect from '../../components/ui/SearchableSelect';
import Button from '../../components/ui/Button';

import { getAvailableFoodsForMenu } from '../../services/foodsApi';
import {
    getMenuMealComposition,
    upsertMenuMealComposition,
} from '../../services/menusApi';

const COURSE_TYPES = [
    { key: 'primo', label: 'Primo' },
    { key: 'secondo', label: 'Secondo' },
    { key: 'contorno', label: 'Contorno' },
    { key: 'ultimo', label: 'Ultimo' },
];

const EMPTY_SELECTED = {
    primo: null,
    secondo: null,
    contorno: null,
    ultimo: null,
};

export default function EditMenuMeal() {
    const navigate = useNavigate();
    const { seasonType, dayIndex, mealType } = useParams();

    const { settimana, giorno } = dayIndexToWeekDay(dayIndex);

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    const [selectedFoods, setSelectedFoods] = useState(EMPTY_SELECTED);
    const [initialFoodIds, setInitialFoodIds] = useState({
        primo: null,
        secondo: null,
        contorno: null,
        ultimo: null,
    });

    const [foodOptions, setFoodOptions] = useState({
        primo: [],
        secondo: [],
        contorno: [],
        ultimo: [],
    });

    const [saving, setSaving] = useState(false);

    // 1) carico le option di tutti i tipi
    useEffect(() => {
        let alive = true;

        async function loadAllFoods() {
            try {
                const results = await Promise.all(
                    COURSE_TYPES.map((c) =>
                        getAvailableFoodsForMenu({
                            type: c.key,
                            season_type: seasonType,
                            meal_type: mealType,
                        }),
                    ),
                );

                const map = {};
                COURSE_TYPES.forEach((c, i) => {
                    map[c.key] = results[i]?.data ?? [];
                });

                if (alive) setFoodOptions(map);
            } catch (err) {
                console.error('Errore caricamento foods:', err);
            }
        }

        loadAllFoods();
        return () => {
            alive = false;
        };
    }, [seasonType, mealType]);

    // 2) carico composizione corrente
    useEffect(() => {
        let alive = true;

        async function load() {
            setLoading(true);
            try {
                const json = await getMenuMealComposition(
                    seasonType,
                    dayIndex,
                    mealType,
                );
                if (!alive) return;

                setData(json);

                const initialSelected = { ...EMPTY_SELECTED };

                (json?.dishes ?? []).forEach((d) => {
                    initialSelected[d.type] = d;
                });

                setSelectedFoods(initialSelected);

                setInitialFoodIds({
                    primo: initialSelected.primo?.id_food ?? null,
                    secondo: initialSelected.secondo?.id_food ?? null,
                    contorno: initialSelected.contorno?.id_food ?? null,
                    ultimo: initialSelected.ultimo?.id_food ?? null,
                });
            } catch (err) {
                console.error(err);
                if (alive) setData(null);
            } finally {
                if (alive) setLoading(false);
            }
        }

        load();
        return () => {
            alive = false;
        };
    }, [seasonType, dayIndex, mealType]);

    const hasAllFourSaved = useMemo(() => {
        const dishes = data?.dishes ?? [];
        const types = new Set(dishes.map((d) => d.type));
        return (
            types.has('primo') &&
            types.has('secondo') &&
            types.has('contorno') &&
            types.has('ultimo')
        );
    }, [data]);

    const allSelectedNow = useMemo(() => {
        return COURSE_TYPES.every((c) =>
            Boolean(selectedFoods[c.key]?.id_food),
        );
    }, [selectedFoods]);

    const hasChanges = useMemo(() => {
        return COURSE_TYPES.some((c) => {
            const now = selectedFoods[c.key]?.id_food ?? null;
            const init = initialFoodIds[c.key] ?? null;
            return now !== init;
        });
    }, [selectedFoods, initialFoodIds]);

    const buttonLabel = hasAllFourSaved ? 'Salva modifica' : 'Aggiungi pasto';
    const pageLabel = hasAllFourSaved ? 'Modifica pasto' : 'Composizione pasto';

    const disableSave =
        saving || !allSelectedNow || (hasAllFourSaved && !hasChanges);

    const totals = useMemo(() => {
        return Object.values(selectedFoods).reduce(
            (acc, f) => {
                if (!f) return acc;
                acc.weight += Number(f.grammage_tot || 0);
                acc.kcal += Number(f.kcal_tot || 0);
                acc.proteins += Number(f.proteins || 0);
                acc.carbs += Number(f.carbs || 0);
                acc.fats += Number(f.fats || 0);
                return acc;
            },
            { weight: 0, kcal: 0, proteins: 0, carbs: 0, fats: 0 },
        );
    }, [selectedFoods]);

    async function handleSaveMeal() {
        for (const c of COURSE_TYPES) {
            if (!selectedFoods[c.key]?.id_food) {
                alert(`Seleziona un piatto per: ${c.label}`);
                return;
            }
        }

        if (hasAllFourSaved && !hasChanges) {
            alert('Nessuna modifica da salvare');
            return;
        }

        const payload = {
            foods: {
                primo: selectedFoods.primo.id_food,
                secondo: selectedFoods.secondo.id_food,
                contorno: selectedFoods.contorno.id_food,
                ultimo: selectedFoods.ultimo.id_food,
            },
        };

        setSaving(true);
        try {
            await upsertMenuMealComposition(
                seasonType,
                dayIndex,
                mealType,
                payload,
            );

            alert(
                hasAllFourSaved
                    ? 'Modifiche salvate correttamente'
                    : 'Pasto aggiunto correttamente',
            );

            navigate(`/menu/edit/${seasonType}`);
        } catch (e) {
            console.error(e);
            alert(e.message || 'Errore salvataggio');
        } finally {
            setSaving(false);
        }
    }

    if (loading)
        return (
            <AppLayout title="GESTIONE MENÙ" username="Antonio">
                <p>Caricamento…</p>
            </AppLayout>
        );

    if (!data)
        return (
            <AppLayout title="GESTIONE MENÙ" username="Antonio">
                <p>Errore</p>
            </AppLayout>
        );

    return (
        <AppLayout title="GESTIONE MENÙ" username="Antonio">
            <div className="flex items-center">
                <h1 className="flex-[1] text-3xl font-semibold">{pageLabel}</h1>

                <div className="flex gap-20 text-xl mt-2">
                    <div className="flex gap-2">
                        <span>Giorno:</span>
                        <span className="text-brand-primary font-bold">
                            {Number(giorno)}
                        </span>
                    </div>

                    <div className="flex gap-2">
                        <span>Settimana:</span>
                        <span className="text-brand-primary font-bold">
                            {Number(settimana)}
                        </span>
                    </div>

                    <div className="flex gap-2">
                        <span>Pasto:</span>
                        <span className="text-brand-primary font-bold">
                            {capitalize(mealType)}
                        </span>
                    </div>
                </div>
            </div>

            <Card className="mt-6 p-6">
                <div className="flex flex-col gap-5">
                    {COURSE_TYPES.map((course, idx) => {
                        const food = selectedFoods[course.key];

                        return (
                            <div key={course.key}>
                                <div className="flex gap-20">
                                    <FormGroup
                                        label={course.label}
                                        className="flex flex-[3]"
                                    >
                                        <SearchableSelect
                                            placeholder={`Seleziona ${course.label.toLowerCase()}`}
                                            value={String(
                                                selectedFoods[course.key]
                                                    ?.id_food ?? '',
                                            )}
                                            options={(
                                                foodOptions[course.key] ?? []
                                            ).map((f) => ({
                                                value: String(f.id_food),
                                                label: f.name,
                                            }))}
                                            onChange={(idFoodStr) => {
                                                const idFood =
                                                    Number(idFoodStr);
                                                const fullFood =
                                                    (
                                                        foodOptions[
                                                            course.key
                                                        ] ?? []
                                                    ).find(
                                                        (f) =>
                                                            f.id_food ===
                                                            idFood,
                                                    ) ?? null;

                                                setSelectedFoods((prev) => ({
                                                    ...prev,
                                                    [course.key]: fullFood,
                                                }));
                                            }}
                                        />
                                    </FormGroup>

                                    <div className="flex-[2] text-md text-brand-textSecondary flex flex-col gap-1 justify-center">
                                        {food ? (
                                            <>
                                                <div>
                                                    <strong>Peso:</strong>{' '}
                                                    {Number(
                                                        food.grammage_tot,
                                                    ).toFixed(2)}{' '}
                                                    g
                                                </div>
                                                <div>
                                                    <strong>Kcal:</strong>{' '}
                                                    {Number(
                                                        food.kcal_tot,
                                                    ).toFixed(2)}
                                                </div>
                                                <div>
                                                    <strong>
                                                        Macro nutrienti:
                                                    </strong>{' '}
                                                    🥩{' '}
                                                    {Number(
                                                        food.proteins,
                                                    ).toFixed(2)}{' '}
                                                    | 🍞{' '}
                                                    {Number(food.carbs).toFixed(
                                                        2,
                                                    )}{' '}
                                                    | 🧈{' '}
                                                    {Number(food.fats).toFixed(
                                                        2,
                                                    )}
                                                </div>
                                            </>
                                        ) : (
                                            <span className="italic opacity-60 mt-5">
                                                Nessun piatto selezionato
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {idx < COURSE_TYPES.length - 1 && (
                                    <div className="border-t border-dashed border-brand-divider mt-6" />
                                )}
                            </div>
                        );
                    })}

                    <div className="mt-3 mb-1 h-px w-full bg-[repeating-linear-gradient(to_right,#C6C6C6_0,#C6C6C6_6px,transparent_6px,transparent_12px)]" />

                    <span className="text-lg font-semibold">
                        Valori nutrizionali complessivi del pasto
                    </span>

                    <Card className="!p-3 rounded-xl mt-[-10px]">
                        <div className="flex justify-between items-center text-md text-brand-textSecondary flex mx-10">
                            <span>
                                <strong>Peso:</strong>{' '}
                                {totals.weight.toFixed(2)}g
                            </span>
                            <span>
                                <strong>Kcal:</strong> {totals.kcal.toFixed(2)}
                            </span>
                            <span className="flex gap-4">
                                <strong>Macro nutrienti:</strong>
                                <span>🥩 {totals.proteins.toFixed(2)}g |</span>
                                <span>🍞 {totals.carbs.toFixed(2)}g |</span>
                                <span>🧈 {totals.fats.toFixed(2)}g</span>
                            </span>
                        </div>
                    </Card>

                    <div className="flex justify-center gap-8">
                        <Button
                            variant="secondary"
                            className="px-5 py-2 mb-[-10px]"
                            onClick={() => navigate(`/menu/edit/${seasonType}`)}
                        >
                            Indietro
                        </Button>

                        <Button
                            className="px-5 py-2 mb-[-10px]"
                            onClick={handleSaveMeal}
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

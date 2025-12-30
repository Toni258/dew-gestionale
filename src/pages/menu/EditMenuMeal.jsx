import AppLayout from '../../components/layout/AppLayout';
import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { dayIndexToWeekDay } from '../../utils/dayIndex';
import { capitalize } from '../../utils/capitalize';

import Card from '../../components/ui/Card';
import FormGroup from '../../components/ui/FormGroup';
import SearchableSelect from '../../components/ui/SearchableSelect';
import Button from '../../components/ui/Button';

const COURSE_TYPES = [
    { key: 'primo', label: 'Primo' },
    { key: 'secondo', label: 'Secondo' },
    { key: 'contorno', label: 'Contorno' },
    { key: 'ultimo', label: 'Ultimo' },
];

export default function EditMenuMeal() {
    const { seasonType, dayIndex, mealType } = useParams();

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const { settimana, giorno } = dayIndexToWeekDay(dayIndex);

    const [selectedFoods, setSelectedFoods] = useState({
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

    async function loadFoodsByType(type) {
        const res = await fetch(`/api/foods?type=${type}`);
        if (!res.ok) throw new Error('Errore caricamento foods');

        const json = await res.json();

        return json.data;
    }

    useEffect(() => {
        async function loadAllFoods() {
            try {
                const results = await Promise.all(
                    COURSE_TYPES.map((c) => loadFoodsByType(c.key))
                );

                const map = {};
                COURSE_TYPES.forEach((c, i) => {
                    map[c.key] = results[i];
                });

                setFoodOptions(map);
            } catch (err) {
                console.error('Errore caricamento foods:', err);
            }
        }

        loadAllFoods();
    }, []);

    const totals = Object.values(selectedFoods).reduce(
        (acc, f) => {
            if (!f) return acc;
            acc.weight += f.grammage_tot;
            acc.kcal += f.kcal_tot;
            acc.proteins += f.proteins;
            acc.carbs += f.carbs;
            acc.fats += f.fats;
            return acc;
        },
        { weight: 0, kcal: 0, proteins: 0, carbs: 0, fats: 0 }
    );

    useEffect(() => {
        async function load() {
            setLoading(true);
            try {
                const res = await fetch(
                    `/api/menus/${encodeURIComponent(
                        seasonType
                    )}/meals/${dayIndex}/${mealType}`
                );

                if (!res.ok) throw new Error('Errore caricamento pasto');

                const json = await res.json();
                setData(json);

                const initialSelected = {
                    primo: null,
                    secondo: null,
                    contorno: null,
                    ultimo: null,
                };

                json.dishes.forEach((d) => {
                    initialSelected[d.type] = d;
                });

                setSelectedFoods(initialSelected);
            } catch (err) {
                console.error(err);
                setData(null);
            } finally {
                setLoading(false);
            }
        }

        load();
    }, [seasonType, dayIndex, mealType]);

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
                <h1 className="flex-[1] text-3xl font-semibold">
                    Composizione pasto
                </h1>
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
                                    {/* TITOLO PORTATA */}
                                    <FormGroup
                                        label={course.label}
                                        className="flex flex-[3]"
                                    >
                                        {/* SELECT + SEARCH */}
                                        <SearchableSelect
                                            placeholder={`Seleziona ${course.label.toLowerCase()}`}
                                            value={
                                                selectedFoods[course.key]
                                                    ?.id_food ?? ''
                                            }
                                            options={foodOptions[
                                                course.key
                                            ].map((f) => ({
                                                value: f.id_food,
                                                label: f.name,
                                            }))}
                                            onChange={(idFood) => {
                                                const fullFood = foodOptions[
                                                    course.key
                                                ].find(
                                                    (f) => f.id_food === idFood
                                                );

                                                setSelectedFoods((prev) => ({
                                                    ...prev,
                                                    [course.key]:
                                                        fullFood ?? null,
                                                }));
                                            }}
                                        />
                                    </FormGroup>

                                    {/* INFO NUTRIZIONALI */}
                                    <div className="flex-[2] text-md text-brand-textSecondary flex flex-col gap-1 justify-center">
                                        {food ? (
                                            <>
                                                <div>
                                                    <strong>Peso:</strong>{' '}
                                                    {food.grammage_tot.toFixed(
                                                        2
                                                    )}{' '}
                                                    g
                                                </div>
                                                <div>
                                                    <strong>Kcal:</strong>{' '}
                                                    {food.kcal_tot.toFixed(2)}
                                                </div>
                                                <div>
                                                    <strong>
                                                        Macro nutrienti:
                                                    </strong>{' '}
                                                    🥩{' '}
                                                    {food.proteins.toFixed(2)} |
                                                    🍞 {food.carbs.toFixed(2)} |
                                                    🧈 {food.fats.toFixed(2)}
                                                </div>
                                            </>
                                        ) : (
                                            <span className="italic opacity-60 mt-5">
                                                Nessun piatto selezionato
                                            </span>
                                        )}
                                    </div>
                                </div>
                                {/* DIVIDER TRA PORTATE */}
                                {idx < COURSE_TYPES.length - 1 && (
                                    <div className="border-t border-dashed border-brand-divider mt-6" />
                                )}
                            </div>
                        );
                    })}

                    {/* Divider orizzontale tratteggiato */}
                    <div className="mt-3 mb-1 h-px w-full bg-[repeating-linear-gradient(to_right,#C6C6C6_0,#C6C6C6_6px,transparent_6px,transparent_12px)]" />

                    {/* TOTALI PASTO */}
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

                    {/* BOTTONE */}
                    <div className="flex justify-center">
                        <Button className="px-5 py-2 mb-[-10px]">
                            Aggiungi pasto
                        </Button>
                    </div>
                </div>
            </Card>
        </AppLayout>
    );
}

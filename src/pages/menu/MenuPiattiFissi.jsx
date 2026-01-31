import AppLayout from '../../components/layout/AppLayout';
import { useParams } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import Button from '../../components/ui/Button';
import SearchableSelect from '../../components/ui/SearchableSelect';

const COURSE_ROWS = [
    { key: 'primo', label: 'PRIMO', slots: 3 },
    { key: 'secondo', label: 'SECONDO', slots: 3 },
    { key: 'contorno', label: 'CONTORNO', slots: 3 },
    { key: 'ultimo', label: 'DESSERT', slots: 3 },
    { key: 'coperto', label: 'COPERTO', slots: 1 },
    { key: 'speciale', label: 'SPECIALE', slots: 1 }, // solo CENA
];

function makeEmptySelected() {
    const base = { pranzo: {}, cena: {} };
    for (const row of COURSE_ROWS) {
        base.pranzo[row.key] = Array(row.slots).fill(null);
        base.cena[row.key] = Array(row.slots).fill(null);
    }
    // speciale NON esiste a pranzo
    base.pranzo.speciale = [];
    return base;
}

// util: inserisce il food dentro options[meal][courseKey] se manca
function ensureInOptions(optionsMap, meal, courseKey, food) {
    if (!food?.id_food) return;
    const list = optionsMap?.[meal]?.[courseKey];
    if (!Array.isArray(list)) return;

    const exists = list.some((x) => Number(x.id_food) === Number(food.id_food));
    if (!exists) {
        // lo metto in cima così lo vede subito
        list.unshift(food);
    }
}

export default function MenuPiattiFissi() {
    const { seasonType } = useParams();

    const decodedSeasonType = useMemo(
        () => decodeURIComponent(seasonType ?? ''),
        [seasonType],
    );

    const [loading, setLoading] = useState(true);

    // selectedFoods[pasto][portata] = array di foods (lunghezza = slots)
    const [selectedFoods, setSelectedFoods] = useState(makeEmptySelected());

    // options[pasto][portata] = array di foods disponibili
    const [options, setOptions] = useState({
        pranzo: {
            primo: [],
            secondo: [],
            contorno: [],
            ultimo: [],
            coperto: [],
        },
        cena: {
            primo: [],
            secondo: [],
            contorno: [],
            ultimo: [],
            coperto: [],
            speciale: [],
        },
    });

    const [saving, setSaving] = useState(false);

    // Ritorna una lista di campi mancanti in formato "PRANZO - PRIMO #2"
    function getMissingFields(selected) {
        const missing = [];

        for (const row of COURSE_ROWS) {
            const courseKey = row.key;

            // PRANZO: speciale non esiste
            const pranzoSlots = courseKey === 'speciale' ? 0 : row.slots;
            const cenaSlots = row.slots;

            // --- PRANZO ---
            for (let i = 0; i < pranzoSlots; i++) {
                const food = selected.pranzo?.[courseKey]?.[i] ?? null;
                if (!food?.id_food) {
                    missing.push(`PRANZO - ${row.label} #${i + 1}`);
                }
            }

            // --- CENA ---
            for (let i = 0; i < cenaSlots; i++) {
                const food = selected.cena?.[courseKey]?.[i] ?? null;
                if (!food?.id_food) {
                    missing.push(`CENA - ${row.label} #${i + 1}`);
                }
            }
        }

        return missing;
    }

    const allFilled = useMemo(() => {
        return getMissingFields(selectedFoods).length === 0;
    }, [selectedFoods]);

    async function handleSaveFixedDishes() {
        // 1) validazione: nessun null in nessuno slot richiesto
        const requiredRowsLunch = [
            'primo',
            'secondo',
            'contorno',
            'ultimo',
            'coperto',
        ];
        const requiredRowsDinner = [
            'primo',
            'secondo',
            'contorno',
            'ultimo',
            'coperto',
            'speciale',
        ];

        const hasEmpty = (meal, keys) => {
            for (const k of keys) {
                const arr = selectedFoods?.[meal]?.[k] ?? [];
                if (arr.some((x) => !x?.id_food)) return true;
            }
            return false;
        };

        if (
            hasEmpty('pranzo', requiredRowsLunch) ||
            hasEmpty('cena', requiredRowsDinner)
        ) {
            alert('Compila tutti i campi dei piatti fissi prima di salvare.');
            return;
        }

        // 2) payload (solo id_food)
        const payload = {
            pranzo: {
                primo: toIdsArray(selectedFoods.pranzo.primo),
                secondo: toIdsArray(selectedFoods.pranzo.secondo),
                contorno: toIdsArray(selectedFoods.pranzo.contorno),
                ultimo: toIdsArray(selectedFoods.pranzo.ultimo),
                coperto: toIdsArray(selectedFoods.pranzo.coperto),
            },
            cena: {
                primo: toIdsArray(selectedFoods.cena.primo),
                secondo: toIdsArray(selectedFoods.cena.secondo),
                contorno: toIdsArray(selectedFoods.cena.contorno),
                ultimo: toIdsArray(selectedFoods.cena.ultimo),
                coperto: toIdsArray(selectedFoods.cena.coperto),
                speciale: toIdsArray(selectedFoods.cena.speciale),
            },
        };

        setSaving(true);
        try {
            const res = await fetch(
                `/api/menus/${encodeURIComponent(decodedSeasonType)}/fixed-dishes`,
                {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                },
            );

            if (!res.ok) {
                const errJson = await res.json().catch(() => null);
                throw new Error(errJson?.error || 'Errore salvataggio');
            }

            alert('Piatti fissi salvati correttamente ✅');
        } catch (e) {
            console.error(e);
            alert(e.message || 'Errore salvataggio');
        } finally {
            setSaving(false);
        }
    }

    // ---------------- UI helpers ----------------

    const HDivider = () => (
        <div className="col-start-2 col-end-5 h-[2px] w-full bg-[repeating-linear-gradient(to_right,#1F1F1F_0,#1F1F1F_10px,transparent_10px,transparent_18px)]" />
    );

    const VDivider = () => (
        <div className="relative w-[2px] self-stretch bg-brand-sidebar">
            <div className="absolute inset-0 bg-[repeating-linear-gradient(to_bottom,#1F1F1F_0,#1F1F1F_10px,transparent_10px,transparent_20px)]" />
        </div>
    );

    function SideLabel({ children }) {
        return (
            <div className="bg-brand-primary rounded-l-xl w-[45px] flex items-center justify-center">
                <span className="[writing-mode:vertical-rl] rotate-180 text-white font-bold text-lg tracking-widest">
                    {children}
                </span>
            </div>
        );
    }

    function InfoMacro({ food }) {
        if (!food) {
            return (
                <div className="mt-4 pl-4 text-brand-textSecondary italic opacity-70">
                    Nessun piatto selezionato
                </div>
            );
        }

        return (
            <div className="flex flex-col gap-y-2 mt-4 pl-4">
                <div className="flex">
                    <span className="w-1/3">
                        Peso: {Number(food.grammage_tot || 0).toFixed(2)} g
                    </span>
                    <span className="w-1/3">
                        Energia: {Number(food.kcal_tot || 0).toFixed(2)} kcal
                    </span>
                </div>
                <div className="flex">
                    <span className="w-1/3">
                        Proteine: {Number(food.proteins || 0).toFixed(2)} g
                    </span>
                    <span className="w-1/3">
                        Carboidrati: {Number(food.carbs || 0).toFixed(2)} g
                    </span>
                    <span className="w-1/3">
                        Grassi: {Number(food.fats || 0).toFixed(2)} g
                    </span>
                </div>
            </div>
        );
    }

    // ---------------- API helpers ----------------

    async function loadFoodsByType({ type, meal_type }) {
        const qs = new URLSearchParams({
            type,
            season_type: decodedSeasonType,
            meal_type,
        });

        const res = await fetch(
            `/api/foods/available-for-menu?${qs.toString()}`,
        );
        if (!res.ok) throw new Error('Errore caricamento foods');
        const json = await res.json();
        return json.data; // array di foods
    }

    async function loadFixedDishes() {
        const res = await fetch(
            `/api/menus/${encodeURIComponent(decodedSeasonType)}/fixed-dishes`,
        );
        if (!res.ok) throw new Error('Errore caricamento piatti fissi');
        const json = await res.json();
        return json.data; // array: {id_food, pasto, portata, name, macros...}
    }

    function toIdsArray(arr) {
        return (arr ?? []).map((f) => Number(f?.id_food ?? 0));
    }

    // ---------------- load on mount ----------------

    useEffect(() => {
        let alive = true;

        async function loadAll() {
            setLoading(true);
            try {
                // 1) options (tutte)
                const toLoad = [];
                for (const row of COURSE_ROWS) {
                    // speciale SOLO cena
                    if (row.key === 'speciale') {
                        toLoad.push(
                            loadFoodsByType({
                                type: 'speciale',
                                meal_type: 'cena',
                            }).then((data) => ({
                                meal: 'cena',
                                key: 'speciale',
                                data,
                            })),
                        );
                        continue;
                    }

                    toLoad.push(
                        loadFoodsByType({
                            type: row.key,
                            meal_type: 'pranzo',
                        }).then((data) => ({
                            meal: 'pranzo',
                            key: row.key,
                            data,
                        })),
                    );
                    toLoad.push(
                        loadFoodsByType({
                            type: row.key,
                            meal_type: 'cena',
                        }).then((data) => ({
                            meal: 'cena',
                            key: row.key,
                            data,
                        })),
                    );
                }

                const loadedOptions = await Promise.all(toLoad);

                const nextOptions = {
                    pranzo: {
                        primo: [],
                        secondo: [],
                        contorno: [],
                        ultimo: [],
                        coperto: [],
                    },
                    cena: {
                        primo: [],
                        secondo: [],
                        contorno: [],
                        ultimo: [],
                        coperto: [],
                        speciale: [],
                    },
                };

                for (const item of loadedOptions) {
                    nextOptions[item.meal][item.key] = item.data;
                }

                // 2) fixed dishes (precompila)
                const fixed = await loadFixedDishes();
                const nextSelected = makeEmptySelected();

                // distribuisco i piatti fissi dentro gli slot
                for (const dish of fixed) {
                    const meal = dish.pasto; // 'pranzo' | 'cena'
                    const course = dish.portata; // 'primo' | 'secondo' | ...

                    if (!nextSelected[meal]) continue;
                    if (!nextSelected[meal][course]) continue;
                    if (meal === 'pranzo' && course === 'speciale') continue;

                    const arr = nextSelected[meal][course];
                    const firstNull = arr.findIndex((x) => x === null);
                    if (firstNull !== -1) arr[firstNull] = dish;
                }

                // ✅ 3) FIX: se un piatto selezionato NON è nelle options, lo aggiungo
                for (const meal of ['pranzo', 'cena']) {
                    const mealCourses = nextSelected[meal] ?? {};
                    for (const courseKey of Object.keys(mealCourses)) {
                        const arr = mealCourses[courseKey] ?? [];
                        for (const food of arr) {
                            if (!food) continue;
                            ensureInOptions(nextOptions, meal, courseKey, food);
                        }
                    }
                }

                if (!alive) return;
                setOptions(nextOptions);
                setSelectedFoods(nextSelected);
            } catch (e) {
                console.error(e);
            } finally {
                if (alive) setLoading(false);
            }
        }

        loadAll();
        return () => {
            alive = false;
        };
    }, [decodedSeasonType]);

    // ---------------- UI renderer ----------------

    function Cell({ meal, courseKey, slots }) {
        const mealOptions = options[meal]?.[courseKey] ?? [];
        const selectedArr = selectedFoods[meal]?.[courseKey] ?? [];

        return (
            <div className="bg-brand-sidebar px-8 py-6">
                {Array.from({ length: slots }).map((_, idx) => {
                    const food = selectedArr[idx] ?? null;

                    return (
                        <div key={`${meal}-${courseKey}-${idx}`}>
                            <SearchableSelect
                                placeholder="Seleziona un piatto fisso"
                                value={String(food?.id_food ?? '')}
                                options={mealOptions.map((f) => ({
                                    value: String(f.id_food),
                                    label: f.name,
                                }))}
                                onChange={(idFoodStr) => {
                                    const idFood = Number(idFoodStr);
                                    const fullFood =
                                        mealOptions.find(
                                            (f) => Number(f.id_food) === idFood,
                                        ) ?? null;

                                    setSelectedFoods((prev) => {
                                        const copy = structuredClone(prev);
                                        copy[meal][courseKey][idx] = fullFood;
                                        return copy;
                                    });
                                }}
                                loading={loading}
                            />

                            <InfoMacro food={food} />

                            {idx < slots - 1 && (
                                <div className="my-6 h-[2px] w-full bg-[repeating-linear-gradient(to_right,#C6C6C6_0,#C6C6C6_6px,transparent_6px,transparent_12px)]" />
                            )}
                        </div>
                    );
                })}
            </div>
        );
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
                <div className="grid grid-cols-[45px_1fr_2px_1fr] gap-x-[2px]">
                    {/* header row */}
                    <div />
                    <div className="bg-brand-primary h-[45px] rounded-t-xl text-white flex items-center justify-center font-bold text-lg tracking-wider">
                        PRANZO
                    </div>
                    <div />
                    <div className="bg-brand-secondary h-[45px] rounded-t-xl text-white flex items-center justify-center font-bold text-lg tracking-wider">
                        CENA
                    </div>

                    {COURSE_ROWS.map((row, idx) => {
                        const isLast = idx === COURSE_ROWS.length - 1;

                        const pranzoSlots =
                            row.key === 'speciale' ? 0 : row.slots;
                        const cenaSlots = row.slots;

                        return (
                            <div key={row.key} className="contents">
                                <SideLabel>{row.label}</SideLabel>

                                {/* PRANZO */}
                                {pranzoSlots === 0 ? (
                                    <div className="bg-brand-sidebar px-8 py-6" />
                                ) : (
                                    <Cell
                                        meal="pranzo"
                                        courseKey={row.key}
                                        slots={pranzoSlots}
                                    />
                                )}

                                <VDivider />

                                {/* CENA */}
                                <div
                                    className={
                                        isLast
                                            ? 'bg-brand-sidebar rounded-br-xl'
                                            : ''
                                    }
                                >
                                    <Cell
                                        meal="cena"
                                        courseKey={row.key}
                                        slots={cenaSlots}
                                    />
                                </div>

                                {!isLast && <HDivider />}
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="flex justify-center mx-4 mt-2 mb-10">
                <Button
                    variant="primary"
                    size="lg"
                    className="w-[240px]"
                    disabled={loading || saving || !allFilled}
                    onClick={handleSaveFixedDishes}
                >
                    {saving ? 'Salvataggio...' : 'Salva piatti fissi'}
                </Button>
            </div>
        </AppLayout>
    );
}

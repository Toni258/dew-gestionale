import AppLayout from '../../components/layout/AppLayout';
import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState, useMemo } from 'react';
import { capitalize } from '../../utils/capitalize';

import DeleteMenuModal from '../../components/modals/DeleteMenuModal';
import ModifyMenuModal from '../../components/modals/ModifyMenuModal';

import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';

async function updateMenu(seasonType, payload) {
    const res = await fetch(`/api/menus/${encodeURIComponent(seasonType)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
        throw new Error(data.error || 'Errore aggiornamento menù');
    }

    return data; // { success:true } oppure menu aggiornato se lo ritorni
}

export default function EditMenu() {
    const { seasonType } = useParams();

    // decodifica esplicita
    const decodedSeasonType = useMemo(
        () => decodeURIComponent(seasonType ?? ''),
        [seasonType]
    );

    const [menu, setMenu] = useState(null);
    const [meals, setMeals] = useState([]);
    const [menuToDelete, setMenuToDelete] = useState(null);
    const [modifyMenu, setModifyMenu] = useState(false);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const mealsByDay = useMemo(() => {
        // meals: [{ day_index, type, is_completed, ... }]
        const map = {};
        for (const m of meals) {
            const d = Number(m.day_index);
            if (!map[d]) map[d] = { pranzo: null, cena: null };
            map[d][m.type] = m;
        }
        return map;
    }, [meals]);

    const daysHeader = [1, 2, 3, 4, 5, 6, 7];
    const weeksHeader = [1, 2, 3, 4];

    // Funzione per chiamata API DELETE menù
    async function deleteMenu(seasonType) {
        const res = await fetch(
            `/api/menus/${encodeURIComponent(seasonType)}`,
            { method: 'DELETE' }
        );

        if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data.error || 'Errore eliminazione menù');
        }
    }

    useEffect(() => {
        async function load() {
            setLoading(true);
            try {
                // info menù
                const resMenu = await fetch(
                    `/api/menus/${encodeURIComponent(decodedSeasonType)}`
                );
                if (!resMenu.ok) throw new Error('Menu non trovato');
                const menuData = await resMenu.json();
                setMenu(menuData);

                // stati pasti
                const resMeals = await fetch(
                    `/api/menus/${encodeURIComponent(
                        decodedSeasonType
                    )}/meals-status`
                );
                if (!resMeals.ok) throw new Error('Errore fetch pasti');
                const mealsData = await resMeals.json();
                setMeals(mealsData.data ?? []);
            } catch (err) {
                console.error(err);
                setMenu(null);
                setMeals([]);
            } finally {
                setLoading(false);
            }
        }

        load();
    }, [decodedSeasonType]);

    if (loading) return <p>Caricamento…</p>;
    if (!menu) return <p>Menù non trovato</p>;

    return (
        <AppLayout title="GESTIONE MENÙ" username="Antonio">
            <h1 className="text-3xl font-semibold">Composizione menù</h1>

            <Card className="flex mt-6 !p-6">
                <div className="flex flex-[1] flex-col items-center justify-center text-lg text-brand-text gap-1">
                    <span>Giorno del menù</span>
                    <span className="text-brand-primary font-semibold">
                        {menu.day_index + 1}
                    </span>
                </div>

                {/* DIVIDER VERTICALE */}
                <div className="w-[1px] bg-brand-divider ml-2 mr-6" />

                <div className="flex flex-[5] flex-col gap-2 justify-center">
                    <div className="flex text-lg text-brand-text gap-2">
                        <span>Nome:</span>
                        <span className="text-brand-primary font-semibold">
                            {capitalize(menu.season_type)}
                        </span>
                    </div>
                    <div className="flex text-lg text-brand-text gap-2">
                        <div className="flex flex-[1] gap-1">
                            <span>Data inizio:</span>
                            <span className="text-brand-primary font-semibold">
                                {menu.start_date}
                            </span>
                        </div>
                        <div className="flex flex-[1] gap-1">
                            <span>Data fine:</span>
                            <span className="text-brand-primary font-semibold">
                                {menu.end_date}
                            </span>
                        </div>
                    </div>
                </div>

                {/* DIVIDER VERTICALE */}
                <div className="w-[1px] bg-brand-divider ml-2 mr-6" />

                <div className="flex flex-[1] flex-col justify-center items-center gap-2 text-lg font-semibold">
                    <span>Piatti fissi</span>
                    <button
                        type="button"
                        className="flex py-2 bg-[#F5C542] rounded-[6px] w-[100px] justify-center"
                        onClick={() => {
                            console.log('Premuto modifica piatti fissi!');
                            navigate(
                                `/menu/edit/${menu.season_type}/piatti_fissi`
                            );
                        }}
                    >
                        <img
                            src="/edit bianco.png"
                            alt="Modifica piatti fissi"
                            className="w-5 h-5 select-none opacity-60"
                            draggable={false}
                        />
                    </button>
                </div>

                {/* DIVIDER VERTICALE */}
                <div className="w-[1px] bg-brand-divider ml-6 mr-6" />

                <div className="flex flex-[1] flex-col justify-center items-center gap-2 text-lg font-semibold">
                    <span>Azioni</span>
                    <div className="flex gap-4">
                        <button
                            className="text-brand-primary font-semibold"
                            onClick={() => {
                                console.log('Premuto bottone modifica menù');
                                setModifyMenu(true);
                            }}
                        >
                            ✏
                        </button>

                        <button
                            className="ml-3 text-red-500"
                            onClick={() => {
                                console.log(
                                    'Premuto bottone cancellazione menù'
                                );
                                setMenuToDelete(menu);
                            }}
                        >
                            🗑
                        </button>
                    </div>
                </div>
            </Card>

            {/* ===== GRIGLIA 7x4 ===== */}
            <div className="mt-4 overflow-x-auto">
                <div className="flex justify-center min-w-fit">
                    <div className="menu-grid-wrapper">
                        <div className="menu-grid">
                            {/* top-left corner (vuoto) */}
                            <div className="menu-grid__corner" />

                            {/* header giorni 1..7 */}
                            {daysHeader.map((d, idx) => (
                                <div
                                    key={`day-h-${d}`}
                                    className={`menu-grid__dayHeader ${
                                        idx === 0
                                            ? 'menu-grid__dayHeader--first'
                                            : ''
                                    } ${
                                        idx === daysHeader.length - 1
                                            ? 'menu-grid__dayHeader--last'
                                            : ''
                                    }`}
                                >
                                    {d}
                                </div>
                            ))}

                            {/* righe settimane */}
                            {weeksHeader.map((w, weekIdx) => (
                                <div key={`week-row-${w}`} className="contents">
                                    {/* header settimana */}
                                    <div
                                        className={`menu-grid__weekHeader ${
                                            weekIdx === 0
                                                ? 'menu-grid__weekHeader--first'
                                                : ''
                                        } ${
                                            weekIdx === weeksHeader.length - 1
                                                ? 'menu-grid__weekHeader--last'
                                                : ''
                                        }`}
                                    >
                                        {w}
                                    </div>

                                    {/* 7 celle */}
                                    {daysHeader.map((d, dayIdx) => {
                                        const dayIndex = weekIdx * 7 + dayIdx; // 0..27
                                        const pranzo =
                                            mealsByDay[dayIndex]?.pranzo;
                                        const cena = mealsByDay[dayIndex]?.cena;
                                        const isLastColumn = dayIdx === 6;
                                        const isLastRow = weekIdx === 3;
                                        const isActiveDay =
                                            dayIndex === menu.day_index;

                                        const pranzoCompleted = Boolean(
                                            pranzo?.is_completed
                                        );
                                        const cenaCompleted = Boolean(
                                            cena?.is_completed
                                        );

                                        return (
                                            <div
                                                key={`cell-${dayIndex}`}
                                                className={`menu-grid__cell
                                                    ${
                                                        isLastColumn
                                                            ? 'no-v-divider'
                                                            : ''
                                                    }
                                                    ${
                                                        isLastRow
                                                            ? 'no-h-divider'
                                                            : ''
                                                    }
                                                    ${
                                                        isActiveDay
                                                            ? 'menu-grid__cell--active'
                                                            : ''
                                                    }
                                                `}
                                            >
                                                {isActiveDay && (
                                                    <span className="menu-grid__activeDot" />
                                                )}

                                                {/* PRANZO */}
                                                <div className="menu-grid__mealBlock">
                                                    <span className="menu-grid__mealTitle">
                                                        Pranzo
                                                    </span>
                                                    <Button
                                                        variant={
                                                            pranzoCompleted
                                                                ? 'primary'
                                                                : 'secondary'
                                                        }
                                                        size="md"
                                                        className="px-3 py-1 rounded-[6px]"
                                                        onClick={() =>
                                                            navigate(
                                                                `/menu/edit/${encodeURIComponent(
                                                                    menu.season_type
                                                                )}/meal/${dayIndex}/pranzo`
                                                            )
                                                        }
                                                    >
                                                        {pranzoCompleted
                                                            ? 'Modifica'
                                                            : 'Componi'}
                                                    </Button>
                                                </div>

                                                {/* CENA */}
                                                <div className="menu-grid__mealBlock">
                                                    <span className="menu-grid__mealTitle">
                                                        Cena
                                                    </span>
                                                    <Button
                                                        variant={
                                                            cenaCompleted
                                                                ? 'primary'
                                                                : 'secondary'
                                                        }
                                                        size="md"
                                                        className="px-3 py-1 rounded-[6px]"
                                                        onClick={() =>
                                                            navigate(
                                                                `/menu/edit/${encodeURIComponent(
                                                                    menu.season_type
                                                                )}/meal/${dayIndex}/cena`
                                                            )
                                                        }
                                                    >
                                                        {cenaCompleted
                                                            ? 'Modifica'
                                                            : 'Componi'}
                                                    </Button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* MODALE ELIMINA MENU' */}
            <DeleteMenuModal
                menu={menuToDelete}
                onClose={() => setMenuToDelete(null)}
                onConfirm={async (menu) => {
                    try {
                        await deleteMenu(menu.season_type);
                        console.log('Elimina menù', menu.season_type);
                        alert('Menù eliminato correttamente');
                        setMenuToDelete(null);
                        navigate(`/menu`);
                    } catch (e) {
                        alert(e.message);
                    }
                }}
            />

            {/* MODALE MODIFICA MENU' */}
            <ModifyMenuModal
                open={modifyMenu}
                menu={menu}
                onClose={() => setModifyMenu(false)}
                onConfirm={async (updatedValues) => {
                    try {
                        // update server
                        await updateMenu(menu.season_type, updatedValues);

                        // aggiorna UI locale (minimo indispensabile)
                        setMenu((prev) => ({
                            ...prev,
                            ...updatedValues,
                        }));

                        alert('Menù modificato correttamente');
                        setModifyMenu(false);
                    } catch (e) {
                        alert(e.message);
                    }
                }}
            />
        </AppLayout>
    );
}

{
    /* <pre className="text-xs mt-4">{JSON.stringify(meals, null, 2)}</pre> */
}

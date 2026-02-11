import AppLayout from '../../components/layout/AppLayout';
import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState, useMemo } from 'react';
import { capitalize } from '../../utils/capitalize';

import DeleteMenuModal from '../../components/modals/DeleteMenuModal';
import ModifyMenuModal from '../../components/modals/ModifyMenuModal';

import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';

import {
    getMenuBySeasonType,
    getMenuMealsStatus,
    updateMenu,
    deleteMenu,
} from '../../services/menusApi';

export default function EditMenu() {
    const { seasonType } = useParams();

    const decodedSeasonType = useMemo(
        () => decodeURIComponent(seasonType ?? ''),
        [seasonType],
    );

    const [menu, setMenu] = useState(null);
    const [meals, setMeals] = useState([]);
    const [menuToDelete, setMenuToDelete] = useState(null);
    const [modifyMenu, setModifyMenu] = useState(false);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const mealsByDay = useMemo(() => {
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

    useEffect(() => {
        let alive = true;

        async function load() {
            setLoading(true);
            try {
                const menuData = await getMenuBySeasonType(decodedSeasonType);
                const mealsData = await getMenuMealsStatus(decodedSeasonType);

                if (!alive) return;

                setMenu(menuData);
                setMeals(mealsData?.data ?? mealsData ?? []);
            } catch (err) {
                console.error(err);
                if (!alive) return;
                setMenu(null);
                setMeals([]);
            } finally {
                if (alive) setLoading(false);
            }
        }

        load();
        return () => {
            alive = false;
        };
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

                <div className="w-[1px] bg-brand-divider ml-2 mr-6" />

                <div className="flex flex-[1] flex-col justify-center items-center gap-2 text-lg font-semibold">
                    <span>Piatti fissi</span>
                    <button
                        type="button"
                        className="flex py-2 bg-[#F5C542] rounded-[6px] w-[100px] justify-center"
                        onClick={() => {
                            navigate(
                                `/menu/edit/${menu.season_type}/piatti_fissi`,
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

                <div className="w-[1px] bg-brand-divider ml-6 mr-6" />

                <div className="flex flex-[1] flex-col justify-center items-center gap-2 text-lg font-semibold">
                    <span>Azioni</span>
                    <div className="flex gap-4">
                        <button
                            className="text-brand-primary font-semibold"
                            onClick={() => setModifyMenu(true)}
                        >
                            ✏
                        </button>

                        <button
                            className="ml-3 text-red-500"
                            onClick={() => setMenuToDelete(menu)}
                        >
                            🗑
                        </button>
                    </div>
                </div>
            </Card>

            <div className="mt-4 overflow-x-auto">
                <div className="flex justify-center min-w-fit">
                    <div className="menu-grid-wrapper">
                        <div className="menu-grid">
                            <div className="menu-grid__corner" />

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

                            {weeksHeader.map((w, weekIdx) => (
                                <div key={`week-row-${w}`} className="contents">
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

                                    {daysHeader.map((_, dayIdx) => {
                                        const dayIndex = weekIdx * 7 + dayIdx;
                                        const pranzo =
                                            mealsByDay[dayIndex]?.pranzo;
                                        const cena = mealsByDay[dayIndex]?.cena;

                                        const pranzoHasIssues =
                                            pranzo &&
                                            !pranzo.is_completed &&
                                            pranzo.day_dishes_count > 0;

                                        const cenaHasIssues =
                                            cena &&
                                            !cena.is_completed &&
                                            cena.day_dishes_count > 0;

                                        const isLastColumn = dayIdx === 6;
                                        const isLastRow = weekIdx === 3;
                                        const isActiveDay =
                                            dayIndex === menu.day_index;

                                        const pranzoCompleted = Boolean(
                                            pranzo?.is_completed,
                                        );
                                        const cenaCompleted = Boolean(
                                            cena?.is_completed,
                                        );

                                        return (
                                            <div
                                                key={`cell-${dayIndex}`}
                                                className={`menu-grid__cell
                                                    ${isLastColumn ? 'no-v-divider' : ''}
                                                    ${isLastRow ? 'no-h-divider' : ''}
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

                                                <div className="menu-grid__mealBlock">
                                                    <span className="menu-grid__mealTitle">
                                                        Pranzo
                                                    </span>
                                                    <Button
                                                        variant={
                                                            pranzoCompleted
                                                                ? 'primary'
                                                                : pranzoHasIssues
                                                                  ? 'danger'
                                                                  : 'secondary'
                                                        }
                                                        size="md"
                                                        className="px-3 py-1 rounded-[6px]"
                                                        onClick={() =>
                                                            navigate(
                                                                `/menu/edit/${encodeURIComponent(
                                                                    menu.season_type,
                                                                )}/meal/${dayIndex}/pranzo`,
                                                            )
                                                        }
                                                    >
                                                        {pranzoCompleted
                                                            ? 'Modifica'
                                                            : pranzoHasIssues
                                                              ? 'Da correggere'
                                                              : 'Componi'}
                                                    </Button>
                                                </div>

                                                <div className="menu-grid__mealBlock">
                                                    <span className="menu-grid__mealTitle">
                                                        Cena
                                                    </span>
                                                    <Button
                                                        variant={
                                                            cenaCompleted
                                                                ? 'primary'
                                                                : cenaHasIssues
                                                                  ? 'danger'
                                                                  : 'secondary'
                                                        }
                                                        size="md"
                                                        className="px-3 py-1 rounded-[6px]"
                                                        onClick={() =>
                                                            navigate(
                                                                `/menu/edit/${encodeURIComponent(
                                                                    menu.season_type,
                                                                )}/meal/${dayIndex}/cena`,
                                                            )
                                                        }
                                                    >
                                                        {cenaCompleted
                                                            ? 'Modifica'
                                                            : cenaHasIssues
                                                              ? 'Da correggere'
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

            <DeleteMenuModal
                menu={menuToDelete}
                onClose={() => setMenuToDelete(null)}
                onConfirm={async (m) => {
                    try {
                        await deleteMenu(m.season_type);
                        alert('Menù eliminato correttamente');
                        setMenuToDelete(null);
                        navigate('/menu');
                    } catch (e) {
                        alert(e.message);
                    }
                }}
            />

            <ModifyMenuModal
                open={modifyMenu}
                menu={menu}
                onClose={() => setModifyMenu(false)}
                onConfirm={async (updatedValues) => {
                    try {
                        await updateMenu(menu.season_type, updatedValues);
                        setMenu((prev) => ({ ...prev, ...updatedValues }));
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

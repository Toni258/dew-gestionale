import AppLayout from '../../components/layout/AppLayout';
import { useParams } from 'react-router-dom';
import { useEffect, useState, useMemo } from 'react';

export default function EditMenu() {
    const { seasonType } = useParams();

    // decodifica esplicita
    const decodedSeasonType = useMemo(
        () => decodeURIComponent(seasonType ?? ''),
        [seasonType]
    );

    const [menu, setMenu] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchMenu() {
            try {
                const res = await fetch(
                    `/api/menus/${encodeURIComponent(decodedSeasonType)}`
                );
                if (!res.ok) throw new Error('Menu non trovato');

                const data = await res.json();
                setMenu(data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }

        fetchMenu();
    }, [seasonType]);

    if (loading) return <p>Caricamento…</p>;
    if (!menu) return <p>Menù non trovato</p>;

    return (
        <AppLayout title="GESTIONE MENÙ" username="Antonio">
            <h1 className="text-3xl font-semibold">
                Modifica menù: {menu.season_type}
            </h1>
        </AppLayout>
    );
}

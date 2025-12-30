import AppLayout from '../../components/layout/AppLayout';
import MenuCard from '../../components/menu/MenuCard';
import { useCallback, useEffect, useState } from 'react';

export default function EditMenu() {
    const [menus, setMenus] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchMenus = useCallback(async () => {
        try {
            const res = await fetch('/api/menus');
            if (!res.ok) throw new Error('Errore fetch menù');

            const data = await res.json();
            setMenus(data.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchMenus();
    }, [fetchMenus]);

    return (
        <AppLayout title="GESTIONE MENÙ" username="Antonio">
            <h1 className="text-3xl font-semibold">
                Elenco Menù attivi e futuri
            </h1>

            <div className="mt-6" />

            {loading && (
                <p className="mx-10 text-brand-textSecondary">
                    Caricamento menù…
                </p>
            )}

            {!loading && menus.length === 0 && (
                <p className="mx-10 text-brand-textSecondary">
                    Nessun menù disponibile
                </p>
            )}

            <div className="flex flex-col gap-8">
                {menus.map((menu) => (
                    <MenuCard key={menu.season_type} menu={menu} />
                ))}
            </div>
        </AppLayout>
    );
}

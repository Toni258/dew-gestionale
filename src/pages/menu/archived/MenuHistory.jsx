// Main page for menu history.
import AppLayout from '../../../components/layout/AppLayout';
import ArchivedMenuCard from '../../../components/menu/ArchivedMenuCard';
import { useCallback, useEffect, useState } from 'react';
import { withLoader } from '../../../services/withLoader';
import { getArchivedMenus } from '../../../services/menusApi';

export default function MenuHistory() {
    // Main state used by the page
    const [menus, setMenus] = useState([]);
    const [loading, setLoading] = useState(true);
    // Memoized handler used by the page

    const fetchMenus = useCallback(async () => {
        setLoading(true);

        try {
            await withLoader('Caricamento menù…', async () => {
                const data = await getArchivedMenus();
                setMenus(data.data ?? []);
            });
        } catch (err) {
            console.error(err);
            setMenus([]);
        } finally {
            setLoading(false);
        }
    }, []);
    // Load data when the component opens

    useEffect(() => {
        fetchMenus();
    }, [fetchMenus]);

    return (
        <AppLayout title="GESTIONE MENÙ">
            <div className="w-full max-w-3xl mx-auto">
                <h1 className="text-3xl font-semibold">Menu Archiviati</h1>

                <div className="mt-6" />

                {loading && (
                    <p className="text-brand-textSecondary">
                        Caricamento menù archiviati…
                    </p>
                )}

                {!loading && menus.length === 0 && (
                    <p className="text-brand-textSecondary">
                        Nessun menù archiviato disponibile
                    </p>
                )}

                <div className="flex flex-col gap-8">
                    {menus.map((menu) => (
                        <ArchivedMenuCard key={menu.season_type} menu={menu} />
                    ))}
                </div>
            </div>
        </AppLayout>
    );
}

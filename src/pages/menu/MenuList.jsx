import AppLayout from '../../components/layout/AppLayout';
import MenuCard from '../../components/menu/MenuCard';
import { useCallback, useEffect, useState } from 'react';
import { withLoader } from '../../services/withLoader';
import { withLoaderNotify } from '../../services/withLoaderNotify';
import ArchiveMenuModal from '../../components/modals/ArchiveMenuModal';
import { archiveMenu, getMenus } from '../../services/menusApi';

export default function MenuList() {
    const [menus, setMenus] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showArchiveModal, setShowArchiveModal] = useState(false);
    const [menuToArchive, setMenuToArchive] = useState(null);
    const [archiving, setArchiving] = useState(false);

    const fetchMenus = useCallback(async () => {
        setLoading(true);

        try {
            await withLoader('Caricamento menù…', async () => {
                const data = await getMenus();
                setMenus(data.data ?? []);
            });
        } catch (err) {
            console.error(err);
            setMenus([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchMenus();
    }, [fetchMenus]);

    function handleOpenArchiveModal(menu) {
        setMenuToArchive(menu);
        setShowArchiveModal(true);
    }

    function handleCloseArchiveModal() {
        setMenuToArchive(null);
        setShowArchiveModal(false);
    }

    async function handleConfirmArchive(menu) {
        setArchiving(true);

        const result = await withLoaderNotify({
            message: 'Archiviazione menù…',
            mode: 'blocking',
            success: 'Menù archiviato correttamente',
            errorTitle: 'Errore archiviazione menù',
            errorMessage: 'Impossibile archiviare il menù.',
            fn: async () => {
                return archiveMenu(menu.season_type);
            },
        });

        setArchiving(false);

        if (!result.ok) return;

        handleCloseArchiveModal();
        await fetchMenus();
    }

    return (
        <AppLayout title="GESTIONE MENÙ">
            <div className="w-full max-w-4xl mx-auto">
                <h1 className="text-3xl font-semibold">Elenco Menù</h1>

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
                        <MenuCard
                            key={menu.season_type}
                            menu={menu}
                            onArchive={handleOpenArchiveModal}
                        />
                    ))}
                </div>
            </div>

            <ArchiveMenuModal
                show={showArchiveModal}
                menu={menuToArchive}
                loading={archiving}
                onClose={handleCloseArchiveModal}
                onConfirm={handleConfirmArchive}
            />
        </AppLayout>
    );
}

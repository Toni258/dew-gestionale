// Layout sidebar.
import { useEffect } from 'react';
import SidebarItem from './SidebarItem';
import SidebarSection from './SidebarSection';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { withLoaderNotify } from '../../services/withLoaderNotify';

export default function Sidebar({ isOpen, onClose }) {
    const { logout, isSuperUser } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        onClose?.();
    }, [location.pathname, onClose]);

    // Handles the logic for logout.
    async function handleLogout() {
        try {
            await withLoaderNotify({
                message: 'Logout…',
                mode: 'blocking',
                errorTitle: 'Errore logout',
                errorMessage: 'Impossibile effettuare il logout.',
                fn: async () => {
                    await logout();
                    return true;
                },
            });
        } finally {
            onClose?.();
            navigate('/login', {
                replace: true,
                state: { from: location.pathname },
            });
        }
    }

    return (
        <>
            <style>{`
                .sidebar-shell {
                    background:
                        linear-gradient(180deg, rgba(255, 255, 255, 0.88) 0%, rgba(255, 255, 255, 0.76) 100%);
                    box-shadow:
                        0 24px 60px rgba(15, 23, 42, 0.16),
                        inset 0 1px 0 rgba(255, 255, 255, 0.78);
                }

                .sidebar-scroll-area {
                    scrollbar-gutter: stable;
                    overscroll-behavior: contain;
                    scrollbar-width: thin;
                    scrollbar-color: rgba(15, 23, 42, 0.20) transparent;
                }

                .sidebar-scroll-area::-webkit-scrollbar {
                    width: 11px;
                }

                .sidebar-scroll-area::-webkit-scrollbar-track {
                    margin: 10px 0;
                    background: transparent;
                }

                .sidebar-scroll-area::-webkit-scrollbar-thumb {
                    border-radius: 999px;
                    border: 3px solid transparent;
                    background-clip: padding-box;
                    background:
                        linear-gradient(180deg, rgba(255, 255, 255, 0.82) 0%, rgba(15, 23, 42, 0.18) 100%);
                    box-shadow:
                        inset 0 1px 0 rgba(255, 255, 255, 0.55),
                        0 2px 10px rgba(15, 23, 42, 0.10);
                    transition:
                        background 160ms ease,
                        box-shadow 160ms ease;
                }

                .sidebar-scroll-area:hover::-webkit-scrollbar-thumb {
                    background:
                        linear-gradient(180deg, rgba(255, 255, 255, 0.88) 0%, rgba(15, 23, 42, 0.24) 100%);
                    box-shadow:
                        inset 0 1px 0 rgba(255, 255, 255, 0.62),
                        0 4px 14px rgba(15, 23, 42, 0.14);
                }

                .sidebar-scroll-area::-webkit-scrollbar-thumb:active {
                    background:
                        linear-gradient(180deg, rgba(255, 255, 255, 0.92) 0%, rgba(15, 23, 42, 0.30) 100%);
                }
            `}</style>

            <button
                type="button"
                aria-label="Chiudi menu laterale"
                className={`fixed inset-0 top-16 z-30 bg-black/30 backdrop-blur-[1px] transition xl:hidden ${
                    isOpen
                        ? 'pointer-events-auto opacity-100'
                        : 'pointer-events-none opacity-0'
                }`}
                onClick={onClose}
            />

            <aside
                className={`fixed left-0 top-16 z-40 h-[calc(100vh-4rem)] w-full max-w-[340px] p-3 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] sm:p-4 xl:w-[310px] xl:max-w-none xl:p-5 ${
                    isOpen ? 'translate-x-0' : '-translate-x-full'
                } xl:translate-x-0`}
            >
                <div className="sidebar-shell flex h-full flex-col overflow-hidden rounded-[28px] border border-white/60 backdrop-blur-2xl">
                    <div className="flex items-center justify-between border-b border-black/5 px-5 py-4 xl:hidden">
                        <div className="text-sm font-semibold uppercase tracking-[0.08em] text-brand-textSecondary">
                            Navigazione
                        </div>

                        <button
                            type="button"
                            onClick={onClose}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-black/10 text-brand-text transition hover:bg-black/5"
                            aria-label="Chiudi navigazione"
                        >
                            <svg
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="h-4 w-4"
                                aria-hidden="true"
                            >
                                <path d="M18 6 6 18M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <div className="relative flex h-full min-h-0 flex-col">
                        <div
                            aria-hidden="true"
                            className="pointer-events-none absolute inset-x-0 top-0 z-10 h-6 bg-gradient-to-b from-white/85 via-white/35 to-transparent"
                        />

                        <div className="sidebar-scroll-area flex h-full min-h-0 flex-col gap-6 overflow-y-auto overflow-x-hidden px-5 py-5 pr-3">
                            <SidebarSection title="Dashboard">
                                <SidebarItem
                                    to="/dashboard"
                                    label="Homepage"
                                    onNavigate={onClose}
                                />
                            </SidebarSection>

                            <SidebarSection title="Gestione Piatti">
                                <SidebarItem
                                    to="/dishes"
                                    label="Visualizza / Modifica piatti"
                                    isActiveOverride={(pathname) =>
                                        pathname.startsWith('/dishes') &&
                                        !pathname.startsWith('/dishes/create')
                                    }
                                    onNavigate={onClose}
                                />
                                <SidebarItem
                                    to="/dishes/create"
                                    label="Aggiungi nuovo piatto"
                                    onNavigate={onClose}
                                />
                            </SidebarSection>

                            <SidebarSection title="Gestione Menù">
                                <SidebarItem
                                    to="/menu"
                                    label="Visualizza / Modifica menù"
                                    isActiveOverride={(pathname) =>
                                        pathname === '/menu' ||
                                        pathname.startsWith('/menu/edit')
                                    }
                                    onNavigate={onClose}
                                />
                                <SidebarItem
                                    to="/menu/create"
                                    label="Aggiungi nuovo menù"
                                    onNavigate={onClose}
                                />
                                <SidebarItem
                                    to="/menu-archived/history"
                                    label="Menù archiviati"
                                    isActiveOverride={(pathname) =>
                                        pathname.startsWith('/menu-archived')
                                    }
                                    onNavigate={onClose}
                                />
                            </SidebarSection>

                            <SidebarSection title="Report">
                                <SidebarItem
                                    to="/statistiche/consumi"
                                    label="Statistiche consumi"
                                    onNavigate={onClose}
                                />
                                <SidebarItem
                                    to="/statistiche/scelte"
                                    label="Statistiche scelte"
                                    onNavigate={onClose}
                                />
                            </SidebarSection>

                            <SidebarSection title="Gestione Utenti">
                                <SidebarItem
                                    to="/user-manager/gestionale"
                                    label="Elenco utenti gestionale"
                                    isActiveOverride={(pathname) =>
                                        pathname.startsWith(
                                            '/user-manager/gestionale',
                                        )
                                    }
                                    onNavigate={onClose}
                                />
                                <SidebarItem
                                    to="/user-manager/mobile"
                                    label="Elenco utenti mobile app"
                                    isActiveOverride={(pathname) =>
                                        pathname.startsWith(
                                            '/user-manager/mobile',
                                        )
                                    }
                                    onNavigate={onClose}
                                />

                                {isSuperUser && (
                                    <SidebarItem
                                        to="/user-manager/create"
                                        label="Crea nuovo utente gestionale"
                                        isActiveOverride={(pathname) =>
                                            pathname === '/user-manager/create'
                                        }
                                        onNavigate={onClose}
                                    />
                                )}
                            </SidebarSection>

                            <div className="mt-auto border-t border-black/5 pt-5">
                                <button
                                    type="button"
                                    onClick={handleLogout}
                                    className="flex items-center gap-2 text-base font-semibold tracking-[0.05em] text-brand-error transition hover:opacity-75 sm:text-lg"
                                >
                                    Logout
                                </button>
                            </div>
                        </div>

                        <div
                            aria-hidden="true"
                            className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-8 bg-gradient-to-t from-white/80 via-white/30 to-transparent"
                        />
                    </div>
                </div>
            </aside>
        </>
    );
}

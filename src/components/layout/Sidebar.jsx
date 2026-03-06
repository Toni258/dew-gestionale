import SidebarItem from './SidebarItem';
import SidebarSection from './SidebarSection';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { withLoaderNotify } from '../../services/withLoaderNotify';

export default function Sidebar() {
    const { logout, isSuperUser } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    async function handleLogout() {
        try {
            await withLoaderNotify({
                message: 'Logout…',
                mode: 'blocking',
                errorTitle: 'Errore logout',
                errorMessage: 'Impossibile effettuare il logout.',
                fn: async () => {
                    await logout(); // chiama /api/auth/logout + setUser(null)
                    return true;
                },
            });
        } finally {
            // replace per non tornare indietro con back su pagine protette
            navigate('/login', {
                replace: true,
                state: { from: location.pathname },
            });
        }
    }

    return (
        <aside className="fixed top-16 left-0 z-40 h-[calc(100vh-4rem)] w-[310px] p-5">
            <div className="h-full rounded-2xl border border-black/10 bg-white/55 backdrop-blur-xl shadow-[0_18px_50px_rgba(0,0,0,0.14)]">
                <div className="flex h-full flex-col gap-6 p-5">
                    {' '}
                    {/* SEZIONE DASHBOARD */}
                    <SidebarSection title="Dashboard">
                        <SidebarItem to="/dashboard" label="Homepage" />
                    </SidebarSection>
                    {/* SEZIONE PIATTI */}
                    <SidebarSection title="Gestione Piatti">
                        <SidebarItem
                            to="/dishes"
                            label="Visualizza / Modifica piatti"
                            isActiveOverride={(pathname) =>
                                pathname.startsWith('/dishes') &&
                                !pathname.startsWith('/dishes/create')
                            }
                        />
                        <SidebarItem
                            to="/dishes/create"
                            label="Aggiungi nuovo piatto"
                        />
                    </SidebarSection>
                    {/* SEZIONE MENU */}
                    <SidebarSection title="Gestione Menù">
                        <SidebarItem
                            to="/menu"
                            label="Visualizza / Modifica menù"
                            isActiveOverride={(pathname) =>
                                pathname === '/menu' ||
                                pathname.startsWith('/menu/edit')
                            }
                        />
                        <SidebarItem
                            to="/menu/create"
                            label="Aggiungi nuovo menù"
                        />
                        <SidebarItem
                            to="/menu-archived/history"
                            label="Menù archiviati"
                            isActiveOverride={(pathname) =>
                                pathname.startsWith('/menu-archived')
                            }
                        />
                    </SidebarSection>
                    {/* SEZIONE STATISTICHE */}
                    <SidebarSection title="Report">
                        <SidebarItem
                            to="/statistiche/consumi"
                            label="Statistiche consumi"
                        />
                        <SidebarItem
                            to="/statistiche/scelte"
                            label="Statistiche scelte"
                        />
                    </SidebarSection>
                    {/* SEZIONE GESTIONE UTENTE */}
                    <SidebarSection title="Gestione Utenti">
                        <SidebarItem
                            to="/user-manager/gestionale"
                            label="Elenco utenti gestionale"
                            isActiveOverride={(pathname) =>
                                pathname.startsWith('/user-manager/gestionale')
                            }
                        />
                        <SidebarItem
                            to="/user-manager/mobile"
                            label="Elenco utenti mobile app"
                            isActiveOverride={(pathname) =>
                                pathname.startsWith('/user-manager/mobile')
                            }
                        />

                        {isSuperUser && (
                            <SidebarItem
                                to="/user-manager/create"
                                label="Crea nuovo utente gestionale"
                                isActiveOverride={(pathname) =>
                                    pathname === '/user-manager/create'
                                }
                            />
                        )}
                    </SidebarSection>
                    {/* ---- LOGOUT IN FONDO ---- */}
                    <div className="mt-auto pt-6">
                        <button
                            type="button"
                            onClick={handleLogout}
                            className="text-brand-error font-semibold tracking-[0.05em] text-lg flex items-center gap-2 hover:opacity-75 transition "
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </div>
        </aside>
    );
}

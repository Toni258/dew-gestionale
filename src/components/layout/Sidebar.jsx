import SidebarItem from './SidebarItem';
import SidebarSection from './SidebarSection';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function Sidebar() {
    const { logout, isSuperUser } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    async function handleLogout() {
        try {
            await logout(); // chiama /api/auth/logout + setUser(null)
        } finally {
            // replace per non tornare indietro con back su pagine protette
            navigate('/login', {
                replace: true,
                state: { from: location.pathname },
            });
        }
    }

    return (
        <aside className="fixed top-16 left-0 w-[290px] h-[calc(100vh-4rem)] bg-brand-sidebar p-6 flex flex-col gap-6 border-r border-brand-divider shadow-sidebar z-40">
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
                <SidebarItem to="/menu/create" label="Aggiungi nuovo menù" />
                <SidebarItem to="/menu/history" label="Menù archiviati" />
            </SidebarSection>

            {/* SEZIONE STATISTICHE */}
            <SidebarSection title="Report Consumi">
                <SidebarItem to="/statistics" label="Statistiche" />
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
                        label="Crea nuovo utente"
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
                    className="text-brand-error font-bold text-xl flex items-center gap-2 hover:opacity-75 transition"
                >
                    Logout
                </button>
            </div>
        </aside>
    );
}

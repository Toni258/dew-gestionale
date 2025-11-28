import { NavLink } from "react-router-dom";
import SidebarItem from "./SidebarItem";
import SidebarSection from "./SidebarSection";

export default function Sidebar() {
    return (
        <aside className="w-[290px] bg-brand-sidebar p-6 flex flex-col gap-6 border-r border-brand-divider shadow-sm">
            
            {/* SEZIONE PIATTI */}
            <SidebarSection title="Gestione Piatti">
                <SidebarItem 
                    to="/dishes" 
                    label="Visualizza / Modifica piatti" 
                    isActiveOverride={(pathname) =>
                        pathname.startsWith("/dishes") && !pathname.startsWith("/dishes/create")
                    }
                />
                <SidebarItem to="/dishes/create" label="Aggiungi nuovo piatto" />
            </SidebarSection>

            {/* SEZIONE MENU */}
            <SidebarSection title="Gestione Menù">
                <SidebarItem to="/menu/edit" label="Visualizza / Modifica menù" />
                <SidebarItem to="/menu/history" label="Menù archiviati" />
            </SidebarSection>

            {/* SEZIONE STATISTICHE */}
            <SidebarSection title="Report Consumi">
                <SidebarItem to="/statistics" label="Statistiche" />
            </SidebarSection>

            {/* SEZIONE GESTIONE UTENTE */}
            <SidebarSection title="Gestione Utenti">
                <SidebarItem to="/user-manager" label="Elenco utenti" />
            </SidebarSection>

            {/* ---- LOGOUT IN FONDO ---- */}
            <div className="mt-auto pt-6">
                <NavLink 
                    to="/logout"
                    className="text-brand-error font-bold text-xl flex items-center gap-2 hover:opacity-75 transition"
                >
                    Logout
                </NavLink>
            </div>
        </aside>
    );
}
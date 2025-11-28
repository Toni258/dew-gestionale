import SidebarItem from "./SidebarItem";
import SidebarSection from "./SidebarSection";

export default function Sidebar() {
    return (
        <aside className="w-[290px] bg-brand-sidebar p-6 flex flex-col gap-6 border-r border-brand-divider shadow-sm">
            
            {/* SEZIONE PIATTI */}
            <SidebarSection title="GESTIONE PIATTI">
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
            <SidebarSection title="GESTIONE MENÙ">
                <SidebarItem to="/menu/edit" label="Visualizza / Modifica menù" />
                <SidebarItem to="/menu/history" label="Menù archiviati" />
            </SidebarSection>
        </aside>
    );
}
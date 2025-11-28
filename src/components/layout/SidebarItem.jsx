import { NavLink, useLocation } from "react-router-dom";

export default function SidebarItem({ to, label, end, isActiveOverride }) {
    const location = useLocation();
    
    return (
        <NavLink 
            to={to}
            end={end}
            className={({ isActive }) => {
                
                // se esiste override, usalo
                if (isActiveOverride) {
                    isActive = isActiveOverride(location.pathname);
                }
                return (
                    "pl-4 pr-2 py-1 flex items-center gap-2 rounded-md transition-colors duration-150 " +
                    (isActive
                        ? "text-brand-primary font-semibold bg-brand-card/40"
                        : "text-brand-textSecondary hover:text-brand-primary hover:bg-brand-card/30")
                );
            }}
        >
            {({ isActive }) => {
                if (isActiveOverride) {
                    isActive = isActiveOverride(location.pathname);
                }

                return (
                    <>
                        <span
                        className={
                            "inline-block w-2 h-2 rounded-full bg-brand-primary transition-all duration-300 ease-out " +
                            (isActive ? "opacity-100 scale-100" : "opacity-0 scale-50")
                        }
                        />
                        <span>{label}</span>
                    </>
                );
            }}
        </NavLink>
    );
}

import { NavLink, useLocation } from 'react-router-dom';

export default function SidebarItem({ to, label, end, isActiveOverride }) {
    const location = useLocation();

    const resolvedIsActive = (isActive) =>
        isActiveOverride ? isActiveOverride(location.pathname) : isActive;

    return (
        <NavLink
            to={to}
            end={end}
            className={({ isActive }) => {
                const active = resolvedIsActive(isActive);

                return (
                    'group flex items-center gap-3 rounded-xl px-3 py-2 text-[14px] transition-all duration-200 ' +
                    (active
                        ? 'bg-white/70 border border-black/10 shadow-[0_10px_25px_rgba(0,0,0,0.10)] text-brand-text font-semibold'
                        : 'text-brand-textSecondary hover:text-brand-text hover:bg-white/45')
                );
            }}
        >
            {({ isActive }) => {
                const active = resolvedIsActive(isActive);

                return (
                    <>
                        <span
                            className={
                                'relative h-2 w-2 rounded-full transition-all duration-200 ' +
                                (active
                                    ? 'bg-brand-primary sidebar-item__activeDot'
                                    : 'group-hover:bg-brand-primary/60')
                            }
                        />
                        <span className="leading-tight">{label}</span>
                    </>
                );
            }}
        </NavLink>
    );
}

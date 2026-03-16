// Layout sidebar item.
import { NavLink, useLocation } from 'react-router-dom';

export default function SidebarItem({
    to,
    label,
    end,
    isActiveOverride,
    onNavigate,
}) {
    const location = useLocation();

    const resolvedIsActive = (isActive) =>
        isActiveOverride ? isActiveOverride(location.pathname) : isActive;

    return (
        <NavLink
            to={to}
            end={end}
            onClick={onNavigate}
            className={({ isActive }) => {
                const active = resolvedIsActive(isActive);

                return (
                    'group flex items-start gap-3 rounded-xl px-3 py-2 text-[14px] transition-all duration-200 ' +
                    (active
                        ? 'border border-black/10 bg-white/70 font-semibold text-brand-text shadow-[0_10px_25px_rgba(0,0,0,0.10)]'
                        : 'text-brand-textSecondary hover:bg-white/45 hover:text-brand-text')
                );
            }}
        >
            {({ isActive }) => {
                const active = resolvedIsActive(isActive);

                return (
                    <>
                        <span
                            className={
                                'relative mt-[7px] h-2 w-2 shrink-0 rounded-full transition-all duration-200 ' +
                                (active
                                    ? 'bg-brand-primary sidebar-item__activeDot'
                                    : 'group-hover:bg-brand-primary/60')
                            }
                        />
                        <span className="leading-tight break-words">{label}</span>
                    </>
                );
            }}
        </NavLink>
    );
}

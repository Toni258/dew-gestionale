import { NavLink, useLocation } from 'react-router-dom';

export default function SidebarItem({ to, label, end, isActiveOverride }) {
    const location = useLocation();

    const resolvedIsActive = (isActive) =>
        isActiveOverride ? isActiveOverride(location.pathname) : isActive;

    return (
        <NavLink
            to={to}
            end={end}
            className={({ isActive }) =>
                'pl-4 pr-2 py-1 flex items-center gap-2 rounded-md transition-colors duration-150 ' +
                (resolvedIsActive(isActive)
                    ? 'text-brand-primary font-semibold bg-brand-card/40'
                    : 'text-brand-textSecondary hover:text-brand-primary hover:bg-brand-card/30')
            }
        >
            {({ isActive }) => (
                <>
                    <span
                        className={
                            'inline-block w-2 h-2 rounded-full bg-brand-primary transition-all duration-300 ease-out ' +
                            (resolvedIsActive(isActive)
                                ? 'opacity-100 scale-100'
                                : 'opacity-0 scale-50')
                        }
                    />
                    <span>{label}</span>
                </>
            )}
        </NavLink>
    );
}

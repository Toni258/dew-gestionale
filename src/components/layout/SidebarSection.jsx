export default function SidebarSection({ title, children }) {
    return(
        <div>
            <h2 className="text-xl font-bold text-brand-text">{title}</h2>

            <nav className="mt-2 flex flex-col gap-1">
                {children}
            </nav>
        </div>
    );
}
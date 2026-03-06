export default function SidebarSection({ title, children }) {
    return (
        <div>
            <h2 className="text-lg font-semibold tracking-[0.03em] text-brand-text uppercase">
                {title}
            </h2>

            <nav className="mt-2 flex flex-col gap-1">{children}</nav>
        </div>
    );
}

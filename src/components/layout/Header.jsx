// Layout header.
import { useAuth } from '../../context/AuthContext';

export default function Header({ title, sidebarOpen, onToggleSidebar }) {
    const { user } = useAuth();

    const username = user ? `${user.name} ${user.surname}` : '';

    return (
        <header className="fixed left-0 top-0 z-50 flex h-16 w-full items-center justify-between border-b border-[#A4A4A4] bg-brand-primary px-4 shadow sm:px-6 lg:px-8 xl:px-10">
            <div className="flex min-w-0 items-center gap-3">
                <button
                    type="button"
                    onClick={onToggleSidebar}
                    aria-label={sidebarOpen ? 'Chiudi menu laterale' : 'Apri menu laterale'}
                    aria-expanded={sidebarOpen}
                    className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-white transition hover:bg-white/15 xl:hidden"
                >
                    <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-5 w-5"
                        aria-hidden="true"
                    >
                        {sidebarOpen ? (
                            <path d="M18 6 6 18M6 6l12 12" />
                        ) : (
                            <>
                                <path d="M3 6h18" />
                                <path d="M3 12h18" />
                                <path d="M3 18h18" />
                            </>
                        )}
                    </svg>
                </button>

                <div className="flex min-w-0 items-center select-none">
                    <img
                        src="/icons/Do Eat Well Logo Bianco.png"
                        alt="logo"
                        className="h-11 w-11 shrink-0 sm:h-[55px] sm:w-[55px]"
                        draggable={false}
                    />

                    <span className="ml-2 hidden truncate text-lg font-semibold text-white sm:block xl:text-xl">
                        DEW Manager
                    </span>
                </div>
            </div>

            <div className="hidden min-w-0 flex-1 px-6 text-center md:block">
                <div className="truncate text-lg font-bold text-white lg:text-2xl">
                    {title}
                </div>
            </div>

            <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/15 px-2 py-1.5 backdrop-blur sm:px-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white shadow-inner">
                        <img
                            src="/icons/user icon verde.png"
                            className="h-5 w-5 object-contain"
                            draggable={false}
                            alt="Utente autenticato"
                        />
                    </div>

                    <span className="hidden max-w-[180px] truncate text-sm font-semibold tracking-wide text-white lg:block">
                        {username}
                    </span>
                </div>
            </div>
        </header>
    );
}

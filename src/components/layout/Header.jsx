// Layout header.
import { useAuth } from '../../context/AuthContext';

export default function Header({ title }) {
    const { user } = useAuth();

    const username = user ? `${user.name} ${user.surname}` : '';

    return (
        <header
            className="
                w-full h-16 bg-brand-primary shadow flex items-center justify-between 
                px-10 fixed top-0 left-0 z-50 border-b border-[#A4A4A4]
            "
        >
            {/* Left: Logo + App Name */}
            <div className="flex items-center select-none">
                <img
                    src="/icons/Do Eat Well Logo Bianco.png"
                    alt="logo"
                    className="w-[55px] h-[55px]"
                    draggable={false}
                />

                <span className="font-semibold text-xl text-white ml-2">
                    DEW Manager
                </span>
            </div>

            {/* Center: Page Title */}
            <div className="text-2xl font-bold text-white">{title}</div>

            {/* Right: User Info */}
            <div className="flex items-center gap-3">
                <div
                    className="
                        flex items-center gap-2 px-3 py-1.5 rounded-xl
                        bg-white/15 backdrop-blur
                        border border-white/20
                    "
                >
                    <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center shadow-inner">
                        <img
                            src="/icons/user icon verde.png"
                            className="w-5 h-5 object-contain"
                            draggable={false}
                        />
                    </div>

                    <span className="text-white text-md font-semibold tracking-wide">
                        {username}
                    </span>
                </div>
            </div>
        </header>
    );
}

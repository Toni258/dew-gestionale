export default function Header({ title, username }) {
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
                    src="/Do Eat Well Logo Bianco.png"
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
            <div className="flex items-center gap-2">
                {/* Avatar wrapper */}
                <div className="w-10 h-10 rounded-full bg-brand-card flex items-center justify-center">
                    <img
                        src="/user icon verde.png"
                        className="w-6 h-6 rounded-full object-cover"
                        draggable={false}
                    />
                </div>

                {/* Username → selezionabile */}
                <span className="font-semibold text-white text-xl">
                    {username}
                </span>
            </div>
        </header>
    );
}

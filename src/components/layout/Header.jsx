export default function Header({ title, username }) {

  return (
    <header className="w-full h-16 bg-brand-primary shadow flex items-center justify-between px-6 fixed top-0 left-0 z-50 border-b border-[#A4A4A4]">

      {/* Left: Logo */}
      <div className="flex items-center gap-1">
        <img src="/Do Eat Well Logo Bianco.png" alt="logo" className="w-12 h-12" />
        <span className="font-semibold text-xl text-white">DoEatWell Manager</span>
      </div>

      {/* Center: Page Title */}
      <div className="text-2xl font-bold text-gray-700 text-white">
        {title}
      </div>

      {/* Right: User */}
      <div className="flex items-center gap-2">
        <img 
          src="/user icon verde.png" 
          className="h-12 w-12 rounded-full object-cover bg-brand-card"
        />
        <span className="font-semibold text-white text-xl">{username}</span>
      </div>

    </header>
  );
}

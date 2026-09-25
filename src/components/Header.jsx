import { Search, Bell, User, Menu } from "lucide-react";

export default function Header({ title, subtitle, onMenuClick }) {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-3 sm:px-6 lg:px-8 border-b border-white/10 bg-slate-950/60 backdrop-blur-xl gap-2">
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <button
          onClick={onMenuClick}
          className="lg:hidden w-9 h-9 shrink-0 flex items-center justify-center rounded-lg bg-white/5 border border-white/10 text-slate-300 hover:text-white"
        >
          <Menu size={18} />
        </button>
        <div className="min-w-0">
          <h1 className="text-base sm:text-lg font-semibold text-white truncate">{title}</h1>
          {subtitle && <p className="hidden sm:block text-xs text-slate-400 truncate">{subtitle}</p>}
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
        <div className="relative hidden md:block">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            placeholder="Search products, SKUs, boxes..."
            className="input-field pl-9 pr-4 py-2 w-52 lg:w-72"
          />
        </div>
        <button className="relative w-9 h-9 flex items-center justify-center rounded-lg bg-white/5 border border-white/10 text-slate-300 hover:text-white shrink-0">
          <Bell size={16} />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-cyan-400" />
        </button>
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shrink-0">
          <User size={16} className="text-white" />
        </div>
      </div>
    </header>
  );
}

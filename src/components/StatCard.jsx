export default function StatCard({ icon: Icon, label, value, accent = "cyan", trend }) {
  const accents = {
    cyan: "from-cyan-500/20 to-cyan-500/0 text-cyan-300 border-cyan-500/20",
    green: "from-emerald-500/20 to-emerald-500/0 text-emerald-300 border-emerald-500/20",
    amber: "from-amber-500/20 to-amber-500/0 text-amber-300 border-amber-500/20",
    red: "from-rose-500/20 to-rose-500/0 text-rose-300 border-rose-500/20",
    purple: "from-purple-500/20 to-purple-500/0 text-purple-300 border-purple-500/20",
  };

  return (
    <div className={`relative overflow-hidden rounded-2xl border ${accents[accent]} bg-white/5 backdrop-blur-xl p-5`}>
      <div className={`absolute inset-0 bg-gradient-to-br ${accents[accent]} opacity-40`} />
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-xs text-slate-400 font-medium">{label}</p>
          <p className="text-2xl font-bold text-white mt-1">{value}</p>
          {trend && <p className="text-xs text-emerald-400 mt-1">{trend}</p>}
        </div>
        {Icon && (
          <div className={`w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center ${accents[accent].split(" ")[2]}`}>
            <Icon size={18} />
          </div>
        )}
      </div>
    </div>
  );
}

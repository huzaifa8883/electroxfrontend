import { useEffect, useState } from "react";
import { Download, X, Smartphone } from "lucide-react";

/**
 * Shows a clear "Install App" banner when the browser supports PWA install.
 * On Android Chrome: real install → app icon on home screen / app drawer.
 * On iOS Safari: instructions for Add to Home Screen (Apple doesn't allow programmatic install).
 */
export default function InstallPrompt() {
  const [deferred, setDeferred] = useState(null);
  const [visible, setVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    // Already running as installed PWA?
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true;
    if (standalone) {
      setInstalled(true);
      return;
    }

    const ios =
      /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    setIsIOS(ios);

    // User dismissed earlier this session?
    if (sessionStorage.getItem("pwa_install_dismissed") === "1") return;

    const onBIP = (e) => {
      e.preventDefault();
      setDeferred(e);
      setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", onBIP);

    // iOS: show manual instructions after a short delay
    if (ios) {
      const t = setTimeout(() => setVisible(true), 2500);
      return () => {
        clearTimeout(t);
        window.removeEventListener("beforeinstallprompt", onBIP);
      };
    }

    return () => window.removeEventListener("beforeinstallprompt", onBIP);
  }, []);

  const dismiss = () => {
    setVisible(false);
    sessionStorage.setItem("pwa_install_dismissed", "1");
  };

  const install = async () => {
    if (!deferred) return;
    deferred.prompt();
    const { outcome } = await deferred.userChoice;
    setDeferred(null);
    setVisible(false);
    if (outcome === "accepted") setInstalled(true);
  };

  if (installed || !visible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-[100] sm:left-auto sm:right-6 sm:max-w-sm animate-fade-in">
      <div className="rounded-2xl border border-cyan-500/30 bg-slate-900/95 backdrop-blur-xl shadow-2xl shadow-cyan-500/10 p-4">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shrink-0">
            <Smartphone size={22} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-semibold text-sm">Install Electrox Inventory</p>
            <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
              {isIOS
                ? "Safari → Share button → “Add to Home Screen” — phir app jaisi chalegi."
                : "Phone pe app install karo. Home screen se open hogi, browser ki zaroorat nahi."}
            </p>
            <div className="flex gap-2 mt-3">
              {!isIOS && deferred && (
                <button
                  onClick={install}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition-colors"
                >
                  <Download size={14} /> Install App
                </button>
              )}
              {isIOS && (
                <span className="text-[11px] text-cyan-300/90 px-2 py-1.5">
                  Share (□↑) → Add to Home Screen
                </span>
              )}
              <button
                onClick={dismiss}
                className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-white/5"
              >
                Later
              </button>
            </div>
          </div>
          <button
            onClick={dismiss}
            className="p-1 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 shrink-0"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

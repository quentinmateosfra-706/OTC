import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Smartphone, X, ChevronRight } from "lucide-react";

const KEY = "otc_install_banner_dismissed";

function shouldShow() {
  if (typeof window === "undefined") return false;
  try { if (localStorage.getItem(KEY)) return false; } catch { /* stockage indisponible */ }
  const standalone =
    window.matchMedia?.("(display-mode: standalone)").matches || window.navigator.standalone === true;
  const mobile = /iphone|ipad|ipod|android/i.test(window.navigator.userAgent || "");
  return mobile && !standalone;
}

// Bandeau « Installe OTC sur ton écran d'accueil » (mobile uniquement, refermable).
export default function InstallBanner() {
  const [visible, setVisible] = useState(shouldShow);
  if (!visible) return null;

  function dismiss(e) {
    e.preventDefault();
    e.stopPropagation();
    try { localStorage.setItem(KEY, "1"); } catch { /* ignore */ }
    setVisible(false);
  }

  return (
    <div className="relative z-50 bg-primary text-primary-foreground">
      <Link
        to="/comment-ca-marche#installer"
        className="mx-auto max-w-5xl flex items-center gap-2.5 pl-4 pr-11 py-2.5 text-xs font-medium"
      >
        <Smartphone className="w-4 h-4 shrink-0" />
        <span className="flex-1 leading-snug">
          <span className="font-bold">Installe OTC</span> sur ton écran d'accueil, comme une vraie app
        </span>
        <ChevronRight className="w-4 h-4 shrink-0" />
      </Link>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Fermer"
        className="absolute right-1.5 top-1/2 -translate-y-1/2 w-8 h-8 inline-flex items-center justify-center rounded-full hover:bg-black/10"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

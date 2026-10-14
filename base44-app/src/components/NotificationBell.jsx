import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { cn } from "@/lib/utils";

function timeAgo(iso) {
  if (!iso) return "";
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "à l'instant";
  if (s < 3600) return `il y a ${Math.floor(s / 60)} min`;
  if (s < 86400) return `il y a ${Math.floor(s / 3600)} h`;
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
}

export default function NotificationBell() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  async function load() {
    if (!user) return;
    try {
      const list = await base44.entities.Notification.filter({ recipient_id: user.id }, "-created_date", 20);
      setItems(list);
    } catch { /* ignore */ }
  }

  useEffect(() => {
    load();
    const t = setInterval(load, 60000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  useEffect(() => {
    function onClick(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  if (!user) return null;
  const unread = items.filter((n) => !n.read);

  async function toggle() {
    const next = !open;
    setOpen(next);
    if (next && unread.length) {
      setItems((prev) => prev.map((n) => ({ ...n, read: true })));
      await Promise.all(unread.map((n) => base44.entities.Notification.update(n.id, { read: true }).catch(() => {})));
    }
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={toggle}
        aria-label="Notifications"
        className="relative inline-flex items-center justify-center w-9 h-9 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
      >
        <Bell className="w-[18px] h-[18px]" />
        {unread.length > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
            {unread.length}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-[min(320px,calc(100vw-2rem))] rounded-2xl border border-border bg-card shadow-xl overflow-hidden z-50">
          <div className="px-4 py-3 border-b border-border text-sm font-semibold">Notifications</div>
          {items.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">Rien pour l'instant.</div>
          ) : (
            <div className="max-h-96 overflow-auto">
              {items.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => { setOpen(false); if (n.link) navigate(n.link); }}
                  className={cn(
                    "w-full text-left px-4 py-3 border-b border-border/40 last:border-0 hover:bg-secondary/50 transition-colors",
                    !n.read && "bg-primary/5"
                  )}
                >
                  <div className="text-sm font-semibold">{n.title}</div>
                  {n.body && <div className="mt-0.5 text-xs text-muted-foreground leading-relaxed">{n.body}</div>}
                  <div className="mt-1 text-[10px] text-muted-foreground/70">{timeAgo(n.created_date)}</div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

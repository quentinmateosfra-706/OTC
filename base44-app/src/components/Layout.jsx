import React from "react";
import { Outlet, NavLink, Link } from "react-router-dom";
import { Home as HomeIcon, ListOrdered, Trophy, Compass, Flag, User, LogIn, LogOut } from "lucide-react";
import Logo from "@/components/Logo";
import { cn } from "@/lib/utils";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { BETA } from "@/lib/beta";
import NotificationBell from "@/components/NotificationBell";
import InstallBanner from "@/components/InstallBanner";

const navItems = [
  { to: "/", label: "Accueil", icon: HomeIcon },
  { to: "/parcours", label: "Courses", icon: ListOrdered },
  { to: "/classement", label: "Classements", icon: Trophy },
  { to: "/comment-ca-marche", label: "Comment", icon: Compass },
  { to: "/manifeste", label: "Manifeste", icon: Flag },
  { to: "/profil", label: "Profil", icon: User }
];

export default function Layout() {
  const { user } = useAuth();
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Top brand bar */}
      <InstallBanner />
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto max-w-5xl px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <Logo size={36} />
            <div className="leading-none">
              <div className="font-heading font-bold tracking-tight text-sm">OTC</div>
              <div className="text-[10px] text-muted-foreground tracking-[0.2em] uppercase">Off Trail Challenge</div>
            </div>
            {BETA && (
              <span className="ml-1 text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full bg-primary text-primary-foreground">
                Bêta
              </span>
            )}
          </Link>
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                end={to === "/"}
                className={({ isActive }) =>
                  cn(
                    "text-xs font-medium px-3 py-2 rounded-full transition-colors",
                    isActive ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground"
                  )
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>
          {user ? (
            <div className="flex items-center gap-1.5">
            <NotificationBell />
            <Link
              to="/profil"
              className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <User className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Mon compte</span>
            </Link>
            </div>
          ) : (
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <LogIn className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Connexion</span>
            </Link>
          )}
        </div>
      </header>

      {/* Page content */}
      <main className="flex-1 pb-24 md:pb-10">
        <Outlet />
      </main>

      {/* Bottom navigation (mobile) */}
      <nav className="fixed bottom-0 inset-x-0 z-40 border-t border-border/60 bg-background/90 backdrop-blur-xl md:hidden">
        <div className="mx-auto max-w-5xl px-1 h-16 grid grid-cols-6">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                cn(
                  "flex flex-col items-center justify-center gap-1 text-[9px] font-medium transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className={cn("w-5 h-5 transition-transform", isActive && "scale-110")} strokeWidth={isActive ? 2.4 : 1.8} />
                  <span className="whitespace-nowrap">{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
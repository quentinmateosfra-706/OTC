import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";

// Force la complétion du profil coureur : tant qu'un utilisateur connecté n'a pas
// de RunnerProfile complet, il est redirigé vers /profil/completer.
export default function ProfileGate() {
  const { user, hasCompleteProfile, profileChecked } = useAuth();
  const location = useLocation();

  if (user && profileChecked && !hasCompleteProfile && location.pathname !== "/profil/completer") {
    return <Navigate to="/profil/completer" replace />;
  }

  return <Outlet />;
}

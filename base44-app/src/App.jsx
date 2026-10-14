import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import ProtectedRoute from '@/components/ProtectedRoute';
import ProfileGate from '@/components/ProfileGate';
import Layout from '@/components/Layout';
import Home from '@/pages/Home';
import Courses from '@/pages/Courses';
import CourseDetail from '@/pages/CourseDetail';
import MapView from '@/pages/MapView';
import Rankings from '@/pages/Rankings';
import Profile from '@/pages/Profile';
import OTCTour from '@/pages/OTCTour';
import Strava from '@/pages/Strava';
import ProfileSetup from '@/pages/ProfileSetup';
import HowItWorks from '@/pages/HowItWorks';
import Manifeste from '@/pages/Manifeste';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import OAuthConsent from '@/pages/OAuthConsent';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/oauth/consent" element={<OAuthConsent />} />
      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
        <Route path="/profil/completer" element={<ProfileSetup />} />
        <Route element={<ProfileGate />}>
          <Route element={<Layout />}>
            <Route path="/parcours" element={<Courses />} />
            <Route path="/parcours/:id" element={<CourseDetail />} />
            <Route path="/carte" element={<MapView />} />
            <Route path="/classement" element={<Rankings />} />
            <Route path="/profil" element={<Profile />} />
            <Route path="/otc-tour" element={<OTCTour />} />
            <Route path="/strava" element={<Strava />} />
          </Route>
        </Route>
      </Route>

      {/* Pages publiques avec navigation */}
      <Route element={<Layout />}>
        <Route path="/comment-ca-marche" element={<HowItWorks />} />
        <Route path="/manifeste" element={<Manifeste />} />
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ScrollToTop />
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App
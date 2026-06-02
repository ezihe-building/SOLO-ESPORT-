import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { setAuthTokenGetter } from "@workspace/api-client-react";
import { supabase } from "@/lib/supabase";

import Landing from "@/pages/Landing";
import AuthPage from "@/pages/Auth";
import Pending from "@/pages/Pending";
import Rejected from "@/pages/Rejected";
import Welcome from "@/pages/Welcome";
import Dashboard from "@/pages/Dashboard";
import Leaderboard from "@/pages/Leaderboard";
import Members from "@/pages/Members";
import Scrims from "@/pages/Scrims";
import Announcements from "@/pages/Announcements";
import Groups from "@/pages/Groups";
import Notifications from "@/pages/Notifications";
import Management from "@/pages/Management";
import Profile from "@/pages/Profile";
import OwnerPanel from "@/pages/OwnerPanel";
import Community from "@/pages/Community";
import Events from "@/pages/Events";
import Feed from "@/pages/Feed";
import Gallery from "@/pages/Gallery";
import NotFound from "@/pages/not-found";

setAuthTokenGetter(async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token || null;
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false },
  },
});

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-[#060608] flex flex-col items-center justify-center gap-4">
      <img src="/clan-logo.jpg" alt="SOLOS+" className="w-16 h-16 rounded-xl object-cover border border-red-500/30 opacity-80 animate-pulse" />
      <span className="text-white/30 text-sm tracking-widest animate-pulse">LOADING...</span>
    </div>
  );
}

function ProtectedRoute({
  component: Component,
  allowedRoles,
}: {
  component: React.ComponentType;
  allowedRoles?: string[];
}) {
  const { user, member, loading, memberLoading } = useAuth();
  if (loading || (user && memberLoading)) return <LoadingScreen />;
  if (!user) return <Redirect to="/auth" />;
  if (member?.status === "pending") return <Redirect to="/pending" />;
  if (member?.status === "rejected") return <Redirect to="/rejected" />;
  if (member?.status === "kicked") return <Redirect to="/rejected" />;
  if (member?.status === "suspended") return <Redirect to="/rejected" />;
  if (allowedRoles && member && !allowedRoles.includes(member.role)) return <Redirect to="/dashboard" />;
  return <Component />;
}

function Router() {
  const { user, member, loading, memberLoading } = useAuth();
  if (loading) return <LoadingScreen />;

  return (
    <Switch>
      <Route path="/">
        {user && !memberLoading && member?.status === "active" ? <Redirect to="/dashboard" /> : <Landing />}
      </Route>
      <Route path="/auth">
        {user && !memberLoading && member?.status === "active" ? <Redirect to="/dashboard" /> : <AuthPage />}
      </Route>
      <Route path="/pending">
        {!user ? <Redirect to="/auth" /> : <Pending />}
      </Route>
      <Route path="/rejected">
        {!user ? <Redirect to="/auth" /> : <Rejected />}
      </Route>
      <Route path="/welcome">
        {!user ? <Redirect to="/auth" /> : <Welcome />}
      </Route>

      {/* Owner panel — password-only */}
      <Route path="/owner" component={OwnerPanel} />

      {/* Protected app routes */}
      <Route path="/dashboard"><ProtectedRoute component={Dashboard} /></Route>
      <Route path="/leaderboard"><ProtectedRoute component={Leaderboard} /></Route>
      <Route path="/members"><ProtectedRoute component={Members} /></Route>
      <Route path="/scrims"><ProtectedRoute component={Scrims} /></Route>
      <Route path="/announcements"><ProtectedRoute component={Announcements} /></Route>
      <Route path="/groups"><ProtectedRoute component={Groups} /></Route>
      <Route path="/notifications"><ProtectedRoute component={Notifications} /></Route>
      <Route path="/profile"><ProtectedRoute component={Profile} /></Route>
      <Route path="/community"><ProtectedRoute component={Community} /></Route>
      <Route path="/events"><ProtectedRoute component={Events} /></Route>
      <Route path="/feed"><ProtectedRoute component={Feed} /></Route>
      <Route path="/gallery"><ProtectedRoute component={Gallery} /></Route>
      <Route path="/management">
        <ProtectedRoute component={Management} allowedRoles={["OWNER", "MANAGEMENT"]} />
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
        </AuthProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

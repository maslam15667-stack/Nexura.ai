import { Switch, Route, Router as WouterRouter, useLocation, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { Layout } from "@/components/Layout";
import Login from "@/pages/Login";

import Home from "@/pages/Home";
import Chat from "@/pages/Chat";
import Anime from "@/pages/Anime";
import MathSolver from "@/pages/Math";
import Search from "@/pages/Search";
import ImageGen from "@/pages/ImageGen";
import Payment from "@/pages/Payment";
import Prompts from "@/pages/Prompts";
import Voice from "@/pages/Voice";
import AICall from "@/pages/AICall";
import Settings from "@/pages/Settings";
import Profile from "@/pages/Profile";
import Admin from "@/pages/Admin";

const queryClient = new QueryClient();

function isLoggedIn() {
  return !!localStorage.getItem("nexura_token");
}

function AuthGuard({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  if (!isLoggedIn()) return <Redirect to="/login" />;
  return <>{children}</>;
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/admin" component={Admin} />
      <Route>
        <AuthGuard>
          <Layout>
            <Switch>
              <Route path="/" component={Home} />
              <Route path="/chat" component={Chat} />
              <Route path="/anime" component={Anime} />
              <Route path="/math" component={MathSolver} />
              <Route path="/search" component={Search} />
              <Route path="/image" component={ImageGen} />
              <Route path="/payment" component={Payment} />
              <Route path="/prompts" component={Prompts} />
              <Route path="/voice" component={Voice} />
              <Route path="/ai-call" component={AICall} />
              <Route path="/settings" component={Settings} />
              <Route path="/profile" component={Profile} />
              <Route component={NotFound} />
            </Switch>
          </Layout>
        </AuthGuard>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

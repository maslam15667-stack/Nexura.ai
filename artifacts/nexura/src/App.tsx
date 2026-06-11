import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { Layout } from "@/components/Layout";

import Home from "@/pages/Home";
import Chat from "@/pages/Chat";
import Anime from "@/pages/Anime";
import MathSolver from "@/pages/Math";
import Search from "@/pages/Search";
import ImageGen from "@/pages/ImageGen";
import Payment from "@/pages/Payment";
import Prompts from "@/pages/Prompts";
import Voice from "@/pages/Voice";
import Settings from "@/pages/Settings";
import Admin from "@/pages/Admin";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/admin-nexura-777" component={Admin} />
      <Route>
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
            <Route path="/settings" component={Settings} />
            <Route component={NotFound} />
          </Switch>
        </Layout>
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

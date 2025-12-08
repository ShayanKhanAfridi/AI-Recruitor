import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import LandingPage from "@/pages/landing";
import LoginPage from "@/pages/login";
import InterviewRoomPage from "@/pages/interview-room";
import ExpiredPage from "@/pages/expired";
import DashboardPage from "@/pages/dashboard";

function Router() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/interview" component={LoginPage} />
      <Route path="/interview/:interviewId" component={LoginPage} />
      <Route path="/interview/:interviewId/room" component={InterviewRoomPage} />
      <Route path="/interview/expired">
        {() => <ExpiredPage type="expired" />}
      </Route>
      <Route path="/interview/not-started">
        {() => <ExpiredPage type="not-started" />}
      </Route>
      <Route path="/interview/completed">
        {() => <ExpiredPage type="completed" />}
      </Route>
      <Route path="/dashboard" component={DashboardPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

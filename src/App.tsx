import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { TournamentProvider } from "@/context/TournamentContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { useTournament } from "@/context/TournamentContext";

import ScrollToTop from "@/components/ScrollToTop";
import LoadingScreen from "@/components/LoadingScreen";
import SaveButton from "@/components/SaveButton";

import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Registration from "./pages/Registration";
import Rules from "./pages/Rules";
import News from "./pages/News";
import NewsDetail from "./pages/NewsDetail";
import Teams from "./pages/Teams";
import TeamDetail from "./pages/TeamDetail";
import Tournament from "./pages/Tournament";
import Schedule from "./pages/Schedule";
import Admin from "./pages/Admin";
import Organizers from "./pages/Organizers";

const queryClient = new QueryClient();

const AppInner: React.FC = () => {
  const { loading } = useTournament();

  if (loading) return <LoadingScreen />;

  return (
    <>
      <ScrollToTop />
      <SaveButton />
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/registration" element={<Registration />} />
        <Route path="/rules" element={<Rules />} />
        <Route path="/news" element={<News />} />
        <Route path="/news/:id" element={<NewsDetail />} />
        <Route path="/teams" element={<Teams />} />
        <Route path="/teams/:id" element={<TeamDetail />} />
        <Route path="/tournament" element={<Tournament />} />
        <Route path="/schedule" element={<Schedule />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/organizers" element={<Organizers />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
};

const App: React.FC = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TournamentProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <HashRouter>
            <AppInner />
          </HashRouter>
        </TooltipProvider>
      </TournamentProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;

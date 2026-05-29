import React from "react";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider, useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Navbar from "./components/Navbar";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import Dashboard from "./pages/dashboard/Dashboard";
import Profile from "./pages/profile/Profile";
import TeamDiscovery from "./pages/teams/TeamDiscovery";
import CreateTeam from "./pages/teams/CreateTeam";
import TeamDetails from "./pages/teams/TeamDetails";
import LeaderDashboard from "./pages/leader/LeaderDashboard";
import RequestDetail from "./pages/leader/RequestDetail";
import PreApprovalChat from "./pages/chat/PreApprovalChat";
import TaskBoard from "./pages/tasks/TaskBoard";
import HackathonList from "./pages/hackathons/HackathonList";
import HackathonDetails from "./pages/hackathons/HackathonDetails";
import NotificationsPage from "./pages/notifications/NotificationsPage";
import PublicProfile from "./pages/profile/PublicProfile";
import TeamChat from "./pages/chat/TeamChat";
import MeetRoom from "./pages/meet/MeetRoom";
import AIMatch from "./pages/ai/AIMatch";
import IdeaValidator from "./pages/ai/IdeaValidator";
import SkillGap from "./pages/ai/SkillGap";

// Route root redirect depending on Auth State
const RootRedirect = () => {
  const { isLoggedIn, loading } = useAuth();
  if (loading) return null; // Let the index-level spinner render or show blank while recovery is run
  return isLoggedIn ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />;
};

const ProtectedLayout = () => {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-main flex flex-col text-text-primary font-sans">
        <Navbar />
        <main className="flex-1 w-full">
          <Outlet />
        </main>
      </div>
    </ProtectedRoute>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        {/* React Hot Toast setup matching dark minimal palette */}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "#1a1a1a",
              color: "#f1f5f9",
              border: "1px solid #2e2e2e",
              borderRadius: "8px",
              fontSize: "14px",
            },
            success: {
              iconTheme: {
                primary: "#22c55e",
                secondary: "#1a1a1a",
              },
            },
            error: {
              iconTheme: {
                primary: "#ef4444",
                secondary: "#1a1a1a",
              },
            },
          }}
        />
        
        <Routes>
          {/* Public / Redirect Routes */}
          <Route path="/" element={<RootRedirect />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/profile/:username" element={<PublicProfile />} />

          {/* Protected Routes */}
          <Route element={<ProtectedLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/teams" element={<TeamDiscovery />} />
            <Route path="/teams/create" element={<CreateTeam />} />
            <Route path="/teams/:teamId" element={<TeamDetails />} />
            <Route path="/leader" element={<LeaderDashboard />} />
            <Route path="/leader/request/:id" element={<RequestDetail />} />
            <Route path="/chat/request/:id" element={<PreApprovalChat />} />
            <Route path="/chat/team/:teamId" element={<TeamChat />} />
            <Route path="/tasks/:teamId" element={<TaskBoard />} />
            <Route path="/hackathons" element={<HackathonList />} />
            <Route path="/hackathons/:id" element={<HackathonDetails />} />
            <Route path="/meet/:roomId" element={<MeetRoom />} />
            <Route path="/ai/match/:teamId" element={<AIMatch />} />
            <Route path="/ai/validate/:teamId" element={<IdeaValidator />} />
            <Route path="/ai/skill-gap/:teamId" element={<SkillGap />} />
            <Route path="/notifications" element={<NotificationsPage />} />
          </Route>

          {/* Catch All Redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;

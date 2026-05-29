import React from "react";
import { useAuth } from "../context/AuthContext";
import { useParams, Link } from "react-router-dom";

// Shared Layout Wrapper with a premium dark Linear.app sidebar & topnav
export const PageLayout = ({ title, children }) => {
  const { user, logout } = useAuth();
  
  return (
    <div className="flex min-h-screen bg-[#0f0f0f] text-[#f1f5f9] font-sans">
      {/* Sidebar */}
      <aside className="w-64 border-r border-[#2e2e2e] bg-[#161616] p-6 flex flex-col justify-between hidden md:flex">
        <div className="space-y-6">
          <div className="flex items-center space-x-3">
            <div className="h-8 w-8 rounded bg-indigo-500 flex items-center justify-center font-bold text-white">P</div>
            <span className="font-bold text-lg tracking-wider text-white">ProvenStack</span>
          </div>
          
          <nav className="space-y-1">
            <Link to="/dashboard" className="flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium hover:bg-[#242424] transition-colors text-indigo-400">
              <span>🏠</span> <span>Dashboard</span>
            </Link>
            <Link to="/teams" className="flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium hover:bg-[#242424] transition-colors text-[#94a3b8]">
              <span>👥</span> <span>Discover Teams</span>
            </Link>
            <Link to="/hackathons" className="flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium hover:bg-[#242424] transition-colors text-[#94a3b8]">
              <span>🏆</span> <span>Hackathons</span>
            </Link>
            <Link to="/leader" className="flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium hover:bg-[#242424] transition-colors text-[#94a3b8]">
              <span>👑</span> <span>Leader Board</span>
            </Link>
            <Link to="/notifications" className="flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium hover:bg-[#242424] transition-colors text-[#94a3b8]">
              <span>🔔</span> <span>Notifications</span>
            </Link>
          </nav>
        </div>

        <div className="border-t border-[#2e2e2e] pt-4 space-y-3">
          <div className="flex items-center space-x-3">
            <div className="h-9 w-9 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold text-white uppercase">
              {user?.name?.slice(0, 2) || "US"}
            </div>
            <div>
              <p className="text-xs font-semibold text-white">{user?.name || "Tester"}</p>
              <p className="text-[10px] text-[#94a3b8]">{user?.email || "tester@provenstack.dev"}</p>
            </div>
          </div>
          <button onClick={logout} className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-red-400 hover:bg-[#242424] transition-colors">
            Logout ➔
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Top Navbar */}
        <header className="h-16 border-b border-[#2e2e2e] bg-[#161616] px-6 flex items-center justify-between">
          <h1 className="font-semibold text-lg text-white">{title}</h1>
          <div className="flex items-center space-x-4">
            <Link to="/profile" className="text-sm font-medium text-[#94a3b8] hover:text-white transition-colors">
              My Profile
            </Link>
          </div>
        </header>

        {/* Content Body */}
        <main className="p-8 overflow-y-auto flex-1 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export const Dashboard = () => (
  <PageLayout title="Dashboard">
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="md:col-span-2 space-y-6">
        <div className="rounded-xl border border-[#2e2e2e] bg-[#1a1a1a] p-6">
          <h2 className="text-xl font-semibold text-white mb-2">Welcome to ProvenStack 🚀</h2>
          <p className="text-[#94a3b8] text-sm">Find teammates, validate startup/project ideas using generative AI, analyze group dynamics, and coordinate tasks smoothly inside this dark-minimalist hackathon environment.</p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link to="/teams/create" className="rounded-xl border border-[#2e2e2e] bg-[#1a1a1a] p-5 hover:border-indigo-500/50 transition-all flex flex-col justify-between h-32 group">
            <div className="text-2xl">⚡</div>
            <div>
              <h3 className="font-semibold text-white group-hover:text-indigo-400 transition-colors">Create a Team</h3>
              <p className="text-[#94a3b8] text-xs mt-1">Start your own project group</p>
            </div>
          </Link>
          <Link to="/teams" className="rounded-xl border border-[#2e2e2e] bg-[#1a1a1a] p-5 hover:border-indigo-500/50 transition-all flex flex-col justify-between h-32 group">
            <div className="text-2xl">🔍</div>
            <div>
              <h3 className="font-semibold text-white group-hover:text-indigo-400 transition-colors">Find a Team</h3>
              <p className="text-[#94a3b8] text-xs mt-1">Browse existing open roles</p>
            </div>
          </Link>
        </div>
      </div>
      
      <div className="space-y-6">
        <div className="rounded-xl border border-[#2e2e2e] bg-[#1a1a1a] p-6 space-y-4">
          <h3 className="font-semibold text-white">Quick Actions</h3>
          <div className="space-y-2">
            <Link to="/hackathons" className="block text-center text-xs font-semibold py-2.5 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-700 transition-all text-white">
              Explore Active Hackathons
            </Link>
          </div>
        </div>
      </div>
    </div>
  </PageLayout>
);

export const Profile = () => (
  <PageLayout title="My Profile">
    <div className="rounded-xl border border-[#2e2e2e] bg-[#1a1a1a] p-8 max-w-2xl">
      <div className="flex items-center space-x-4 mb-6">
        <div className="h-16 w-16 rounded-full bg-indigo-600 flex items-center justify-center text-lg font-bold text-white">ME</div>
        <div>
          <h2 className="text-2xl font-bold text-white">User Profile</h2>
          <p className="text-[#94a3b8] text-sm">Configure your settings and tech handles</p>
        </div>
      </div>
    </div>
  </PageLayout>
);

export const PublicProfile = () => {
  const { username } = useParams();
  return (
    <div className="min-h-screen bg-[#0f0f0f] text-[#f1f5f9] flex items-center justify-center p-6">
      <div className="rounded-xl border border-[#2e2e2e] bg-[#1a1a1a] p-8 max-w-md w-full text-center space-y-4">
        <div className="h-16 w-16 mx-auto rounded-full bg-indigo-600 flex items-center justify-center text-lg font-bold text-white">UP</div>
        <h2 className="text-xl font-bold text-white">@{username}</h2>
        <p className="text-[#94a3b8] text-sm">This profile is publicly accessible. Explore their hackathon accomplishments, top skills, and code repository integrations.</p>
        <Link to="/login" className="inline-block text-xs font-semibold text-indigo-400 hover:underline">
          Go back to Login
        </Link>
      </div>
    </div>
  );
};

export const TeamDiscovery = () => (
  <PageLayout title="Teammate Finder">
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <p className="text-[#94a3b8] text-sm">Browse open slots for backend developer, frontend designer, or AI product strategist roles.</p>
        <Link to="/teams/create" className="text-xs font-semibold bg-indigo-600 py-2 px-4 rounded-lg hover:bg-indigo-700 text-white">
          + Create New Team
        </Link>
      </div>
    </div>
  </PageLayout>
);

export const CreateTeam = () => (
  <PageLayout title="Create a Team">
    <div className="rounded-xl border border-[#2e2e2e] bg-[#1a1a1a] p-8 max-w-xl">
      <h2 className="text-xl font-bold text-white mb-6">Setup Your Hackathon Squad</h2>
    </div>
  </PageLayout>
);

export const TeamDetails = () => {
  const { teamId } = useParams();
  return (
    <PageLayout title={`Team Details — ${teamId?.slice(0, 8)}`}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <div className="rounded-xl border border-[#2e2e2e] bg-[#1a1a1a] p-6">
            <h2 className="text-2xl font-bold text-white mb-4">Workspace Details</h2>
            <div className="flex space-x-3">
              <Link to={`/ai/match/${teamId}`} className="text-xs font-semibold bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 px-4 py-2 rounded-lg hover:bg-indigo-600/30">
                AI Matchmaker
              </Link>
              <Link to={`/ai/skill-gap/${teamId}`} className="text-xs font-semibold bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 px-4 py-2 rounded-lg hover:bg-indigo-600/30">
                AI Skill Gap Analysis
              </Link>
              <Link to={`/tasks/${teamId}`} className="text-xs font-semibold bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 px-4 py-2 rounded-lg hover:bg-indigo-600/30">
                Task Board
              </Link>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export const LeaderDashboard = () => (
  <PageLayout title="Leader Board">
    <div className="rounded-xl border border-[#2e2e2e] bg-[#1a1a1a] p-8">
      <h2 className="text-xl font-bold text-white mb-4">Hackathon Standings</h2>
    </div>
  </PageLayout>
);

export const RequestDetail = () => {
  const { id } = useParams();
  return (
    <PageLayout title={`Request Details — ${id}`}>
      <div className="rounded-xl border border-[#2e2e2e] bg-[#1a1a1a] p-8">
        <h2 className="text-xl font-bold text-white mb-4">Incoming Request</h2>
      </div>
    </PageLayout>
  );
};

export const PreApprovalChat = () => {
  const { id } = useParams();
  return (
    <PageLayout title={`Direct Message — Request ${id}`}>
      <div className="rounded-xl border border-[#2e2e2e] bg-[#1a1a1a] p-8 h-96 flex flex-col justify-between">
        <p className="text-sm text-[#94a3b8]">Chat securely with candidate before accepting them to your team.</p>
      </div>
    </PageLayout>
  );
};

export const TeamChat = () => {
  const { teamId } = useParams();
  return (
    <PageLayout title={`Team Lounge — ${teamId?.slice(0, 8)}`}>
      <div className="rounded-xl border border-[#2e2e2e] bg-[#1a1a1a] p-8 h-96 flex flex-col justify-between">
        <p className="text-sm text-[#94a3b8]">Secure group chat for team members.</p>
      </div>
    </PageLayout>
  );
};

export const TaskBoard = () => {
  const { teamId } = useParams();
  return (
    <PageLayout title={`Sprint Task Board — Team ${teamId?.slice(0, 8)}`}>
      <div className="rounded-xl border border-[#2e2e2e] bg-[#1a1a1a] p-8">
        <p className="text-sm text-[#94a3b8] mb-4">Manage and coordinate tasks in forming and active sprints.</p>
      </div>
    </PageLayout>
  );
};

export const HackathonList = () => (
  <PageLayout title="Upcoming Hackathons">
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="rounded-xl border border-[#2e2e2e] bg-[#1a1a1a] p-6 space-y-4">
        <h3 className="font-bold text-white text-lg">ProvenStack Hack-Sprint</h3>
        <p className="text-xs text-[#94a3b8]">Location: Bangalore, India / Online</p>
      </div>
    </div>
  </PageLayout>
);

export const HackathonDetails = () => {
  const { id } = useParams();
  return (
    <PageLayout title={`Hackathon Specifications — ${id}`}>
      <div className="rounded-xl border border-[#2e2e2e] bg-[#1a1a1a] p-8">
        <h2 className="text-xl font-bold text-white mb-4">Challenge Description</h2>
      </div>
    </PageLayout>
  );
};

export const MeetRoom = () => {
  const { roomId } = useParams();
  return (
    <PageLayout title={`Video Meeting — Room ${roomId}`}>
      <div className="rounded-xl border border-[#2e2e2e] bg-[#1a1a1a] p-8 h-96 flex items-center justify-center">
        <p className="text-sm text-indigo-400 animate-pulse">Connecting PeerJS Video streams...</p>
      </div>
    </PageLayout>
  );
};

export const AIMatch = () => {
  const { teamId } = useParams();
  return (
    <PageLayout title={`AI Teammate Suggestor — Team ${teamId?.slice(0, 8)}`}>
      <div className="rounded-xl border border-[#2e2e2e] bg-[#1a1a1a] p-8">
        <p className="text-sm text-[#94a3b8]">Gemini-powered algorithmic teammate matchmaker.</p>
      </div>
    </PageLayout>
  );
};

export const IdeaValidator = () => {
  const { teamId } = useParams();
  return (
    <PageLayout title={`AI Project Idea Validator — Team ${teamId?.slice(0, 8)}`}>
      <div className="rounded-xl border border-[#2e2e2e] bg-[#1a1a1a] p-8">
        <p className="text-sm text-[#94a3b8]">Use Gemini's intelligence to evaluate feasibility of your project concept.</p>
      </div>
    </PageLayout>
  );
};

export const SkillGap = () => {
  const { teamId } = useParams();
  return (
    <PageLayout title={`AI Skill Gap Advisor — Team ${teamId?.slice(0, 8)}`}>
      <div className="rounded-xl border border-[#2e2e2e] bg-[#1a1a1a] p-8">
        <p className="text-sm text-[#94a3b8]">Identifies core engineering gaps inside active profiles and suggests learning roadmaps.</p>
      </div>
    </PageLayout>
  );
};

export const NotificationsPage = () => (
  <PageLayout title="Notification Center">
    <div className="rounded-xl border border-[#2e2e2e] bg-[#1a1a1a] p-8">
      <h2 className="text-xl font-bold text-white mb-4">Recent Updates</h2>
    </div>
  </PageLayout>
);

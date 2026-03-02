import React, { useState, useEffect, useMemo } from "react";
import { Dashboard } from "./pages/Dashboard";
import { MemberDashboard } from "./pages/MemberDashboard";
import { TeamList } from "./components/TeamList";
import { SongLibrary } from "./pages/SongLibrary";
import { ServicePlanner } from "./pages/ServicePlanner";
import { MyPortal } from "./pages/MyPortal";
import { Login } from "./pages/Login";
import { ProfileSettings } from "./pages/ProfileSettings";
import {
  LayoutGrid,
  Users,
  Music,
  Calendar,
  LogOut,
  Menu,
  X,
  UserCircle,
  Loader2,
} from "lucide-react";
import {
  AssignmentStatus,
  Member,
  Song,
  ServicePlan,
  Announcement,
} from "./types/types";
import { auth } from "./utils/auth";
import { api } from "./services/api";
import { ToastProvider, useToast } from "./components/Toast";

type View =
  | "dashboard"
  | "team"
  | "songs"
  | "schedule"
  | "myportal"
  | "profile";

const MainLayout: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<Member | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Data State
  const [services, setServices] = useState<ServicePlan[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [songs, setSongs] = useState<Song[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  const [currentView, setCurrentView] = useState<View>("dashboard");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const { showToast } = useToast();

  // 1. Initialize Auth
  useEffect(() => {
    const unsubscribe = auth.onChange((user) => {
      setCurrentUser(user);
      if (user) {
        // Default to dashboard for everyone on load
        if (authLoading) {
          setCurrentView("dashboard");
        }
      } else {
        // Clear data on logout
        setServices([]);
        setMembers([]);
        setSongs([]);
        setAnnouncements([]);
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, [authLoading]);

  // Derived state: Sync currentUser with real-time members data to avoid stale state (e.g. unavailableDates)
  const liveCurrentUser = useMemo(() => {
    if (!currentUser) return null;
    return members.find((m) => m.id === currentUser.id) || currentUser;
  }, [currentUser, members]);

  // 2. Real-time Data Subscriptions
  useEffect(() => {
    if (!currentUser) return;

    // Set up listeners
    const unsubMembers = api.subscribeMembers((data) => setMembers(data));
    const unsubSongs = api.subscribeSongs((data) => setSongs(data));
    const unsubServices = api.subscribeServices((data) => setServices(data));
    const unsubAnnouncements = api.subscribeAnnouncements((data) =>
      setAnnouncements(data)
    );

    // Cleanup listeners when component unmounts or user logs out
    return () => {
      unsubMembers();
      unsubSongs();
      unsubServices();
      unsubAnnouncements();
    };
  }, [currentUser?.id]);

  const handleLogout = async () => {
    await auth.signOut();
    showToast("Logged out successfully", "info");
  };

  // --- Updates ---

  const handleStatusUpdate = async (
    serviceId: string,
    status: AssignmentStatus
  ) => {
    if (!liveCurrentUser) return;
    const service = services.find((s) => s.id === serviceId);
    if (service) {
      await api.updateServiceStatus(service, liveCurrentUser.id, status);
      showToast(`Status updated to ${status}`, "success");
    }
  };

  const handleAvailabilityUpdate = async (date: string, reason?: string) => {
    if (!liveCurrentUser) return;
    await api.updateMemberAvailability(liveCurrentUser, date, reason);
    showToast("Availability updated", "success");
  };

  // --- Render ---

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 text-black animate-spin" />
          <p className="text-slate-500 font-medium">Loading LSMIsystem...</p>
        </div>
      </div>
    );
  }

  if (!liveCurrentUser) {
    return <Login onLogin={() => {}} />;
  }

  const isAdmin = liveCurrentUser.systemRole === "Admin";

  const NavItem = ({
    view,
    icon: Icon,
    label,
  }: {
    view: View;
    icon: React.ElementType;
    label: string;
  }) => (
    <button
      onClick={() => {
        setCurrentView(view);
        setIsMobileMenuOpen(false);
      }}
      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
        currentView === view
          ? "bg-black text-white shadow-md"
          : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
      }`}
    >
      <Icon size={20} />
      <span className="font-medium">{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0
        ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"}
      `}
      >
        <div className="h-full flex flex-col">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between lg:justify-start lg:gap-3">
            <div className="bg-black p-2 rounded-lg">
              <Music className="text-white" size={24} />
            </div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">
              LSMIsystem
            </h1>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="lg:hidden text-slate-400"
            >
              <X size={24} />
            </button>
          </div>

          <nav className="flex-1 p-4 space-y-2">
            <NavItem view="dashboard" icon={LayoutGrid} label="Dashboard" />
            <NavItem view="myportal" icon={UserCircle} label="My Zone" />
            <NavItem view="schedule" icon={Calendar} label="Services" />
            <NavItem view="songs" icon={Music} label="Songs" />
            <NavItem view="team" icon={Users} label="Team" />
          </nav>

          <div className="p-4 border-t border-slate-100">
            <div className="pt-4">
              <div
                onClick={() => setCurrentView("profile")}
                className={`flex items-center space-x-3 px-2 py-2 rounded-lg cursor-pointer transition-colors ${
                  currentView === "profile"
                    ? "bg-slate-100 border border-slate-200"
                    : "hover:bg-slate-50"
                }`}
              >
                <img
                  src={liveCurrentUser.avatar}
                  alt="Profile"
                  className="w-9 h-9 rounded-full bg-slate-200 object-cover border border-slate-200"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">
                    {liveCurrentUser.name}
                  </p>
                  <p className="text-xs text-slate-500 truncate">
                    {liveCurrentUser.systemRole}
                  </p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full mt-2 flex items-center justify-center space-x-2 text-slate-400 hover:text-red-600 hover:bg-red-50 py-2 rounded-lg transition-colors text-xs font-medium"
              >
                <LogOut size={16} />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0 overflow-hidden flex flex-col h-screen">
        {/* Mobile Header */}
        <div className="lg:hidden bg-white border-b border-slate-200 p-4 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-2">
            <div className="bg-black p-1.5 rounded">
              <Music className="text-white" size={18} />
            </div>
            <span className="font-bold text-slate-800">LSMIsystem</span>
          </div>
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="text-slate-500"
          >
            <Menu size={24} />
          </button>
        </div>

        {/* Content Scroll Area */}
        <div className="flex-1 overflow-auto p-4 md:p-8">
          <div className="max-w-7xl mx-auto">
            {currentView === "dashboard" &&
              (isAdmin ? (
                <Dashboard
                  members={members}
                  songs={songs}
                  services={services}
                  announcements={announcements}
                />
              ) : (
                <MemberDashboard
                  currentUser={liveCurrentUser}
                  services={services}
                  announcements={announcements}
                  songs={songs}
                />
              ))}

            {currentView === "myportal" && (
              <MyPortal
                currentUser={liveCurrentUser}
                services={services}
                onUpdateStatus={handleStatusUpdate}
                onUpdateAvailability={handleAvailabilityUpdate}
              />
            )}

            {currentView === "team" && (
              <TeamList members={members} isReadOnly={!isAdmin} />
            )}

            {currentView === "songs" && (
              <SongLibrary songs={songs} currentUser={liveCurrentUser} />
            )}

            {currentView === "schedule" && (
              <ServicePlanner
                services={services}
                songs={songs}
                members={members}
                isReadOnly={!isAdmin}
              />
            )}

            {currentView === "profile" && (
              <ProfileSettings currentUser={liveCurrentUser} />
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <ToastProvider>
      <MainLayout />
    </ToastProvider>
  );
};

export default App;

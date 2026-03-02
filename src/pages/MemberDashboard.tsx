import React from "react";
import { Member, ServicePlan, Announcement, Song } from "../types/types";
import {
  Calendar,
  Clock,
  Music,
  CheckCircle2,
  AlertCircle,
  Bell,
} from "lucide-react";

interface MemberDashboardProps {
  currentUser: Member;
  services: ServicePlan[];
  announcements: Announcement[];
  songs: Song[];
}

export const MemberDashboard: React.FC<MemberDashboardProps> = ({
  currentUser,
  services,
  announcements,
  songs,
}) => {
  // Logic to find next service
  const today = new Date().toISOString().split("T")[0];

  const myUpcomingServices = services
    .filter(
      (s) =>
        s.date >= today && s.team.some((t) => t.memberId === currentUser.id)
    )
    .sort((a, b) => a.date.localeCompare(b.date));

  const nextService = myUpcomingServices[0];
  const otherServices = myUpcomingServices.slice(1);
  const recentAnnouncements = announcements.slice(0, 3);

  // Helper to get my role in a service
  const getMyRole = (service: ServicePlan) => {
    const assignment = service.team.find((t) => t.memberId === currentUser.id);
    return assignment;
  };

  const getSongDetails = (id: string) => songs.find((s) => s.id === id);

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Welcome back, {currentUser.name.split(" ")[0]}!
          </h1>
          <p className="text-slate-500">
            You have {myUpcomingServices.length} upcoming services scheduled.
          </p>
        </div>
        <div className="flex gap-2">
          <div className="text-right hidden md:block">
            <p className="text-xs font-bold uppercase text-slate-400">
              Next Service
            </p>
            <p className="font-medium text-slate-900">
              {nextService
                ? `${nextService.date} @ ${nextService.time}`
                : "Nothing scheduled"}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Column: Next Service */}
        <div className="lg:col-span-2 space-y-6">
          {nextService ? (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="bg-gradient-to-r from-slate-800 to-black px-6 py-4 flex justify-between items-center text-white">
                <div className="flex items-center gap-2">
                  <Calendar className="text-slate-400" size={20} />
                  <span className="font-bold">Next Up</span>
                </div>
                <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm">
                  {new Date(nextService.date).toLocaleDateString(undefined, {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              </div>

              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-800">
                      {nextService.title}
                    </h2>
                    <div className="flex items-center gap-4 mt-2 text-slate-500 text-sm">
                      <span className="flex items-center gap-1">
                        <Clock size={16} /> {nextService.time}
                      </span>
                      {nextService.rehearsal && (
                        <span className="flex items-center gap-1 text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-100">
                          <Clock size={14} /> Rehearsal:{" "}
                          {nextService.rehearsal.time}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="block text-xs uppercase font-bold text-slate-400 mb-1">
                      Your Role
                    </span>
                    <span className="inline-block bg-slate-100 text-slate-800 px-3 py-1 rounded-lg font-bold border border-slate-200 text-sm">
                      {getMyRole(nextService)?.role}
                    </span>
                  </div>
                </div>

                {/* Setlist */}
                <div className="bg-slate-50 rounded-xl border border-slate-100 p-5">
                  <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Music size={16} /> Setlist
                  </h3>
                  <div className="space-y-3">
                    {nextService.setlist.map((item, idx) => {
                      const song = getSongDetails(item.songId);
                      return (
                        <div
                          key={idx}
                          className="flex items-center justify-between bg-white p-3 rounded-lg border border-slate-200 shadow-sm"
                        >
                          <div className="flex items-center gap-3">
                            <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-xs font-bold">
                              {idx + 1}
                            </span>
                            <div>
                              <p className="font-semibold text-slate-800 text-sm">
                                {song?.title || "Unknown"}
                              </p>
                              <p className="text-xs text-slate-400">
                                {song?.artist}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="block text-xs font-mono font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded">
                              Key: {item.key}
                            </span>
                            {item.note && (
                              <span className="text-[10px] text-slate-500 italic mt-1 block">
                                {item.note}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    {nextService.setlist.length === 0 && (
                      <p className="text-slate-400 italic text-sm text-center py-2">
                        No songs added yet.
                      </p>
                    )}
                  </div>
                </div>

                {/* Notes */}
                {nextService.notes && (
                  <div className="mt-6 flex gap-3 p-4 bg-blue-50 text-blue-800 rounded-lg text-sm border border-blue-100">
                    <AlertCircle className="flex-shrink-0" size={18} />
                    <p>{nextService.notes}</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
              <div className="bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="text-slate-400" size={32} />
              </div>
              <h3 className="text-lg font-bold text-slate-800">
                No Upcoming Services
              </h3>
              <p className="text-slate-500 mt-2">
                You are not currently scheduled for any upcoming services.
              </p>
            </div>
          )}
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Announcements */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center gap-2">
              <Bell className="text-black" size={18} />
              <h3 className="font-bold text-slate-800">Latest Updates</h3>
            </div>
            <div className="divide-y divide-slate-100">
              {recentAnnouncements.map((ann) => (
                <div
                  key={ann.id}
                  className="p-4 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="font-semibold text-slate-700 text-sm">
                      {ann.title}
                    </h4>
                    <span className="text-[10px] text-slate-400">
                      {ann.date}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-3">
                    {ann.content}
                  </p>
                </div>
              ))}
              {recentAnnouncements.length === 0 && (
                <div className="p-4 text-center text-slate-400 text-sm italic">
                  No announcements
                </div>
              )}
            </div>
          </div>

          {/* Future Schedule List */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-800">Future Schedule</h3>
            </div>
            <div className="divide-y divide-slate-100">
              {otherServices.length > 0 ? (
                otherServices.slice(0, 5).map((svc) => {
                  const role = getMyRole(svc);
                  return (
                    <div
                      key={svc.id}
                      className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
                    >
                      <div>
                        <p className="font-semibold text-slate-700 text-sm">
                          {svc.date}
                        </p>
                        <p className="text-xs text-slate-500">{svc.title}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-medium text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                          {role?.role}
                        </span>
                        <div className="mt-1">
                          {role?.status === "Confirmed" ? (
                            <CheckCircle2
                              size={14}
                              className="text-emerald-500 ml-auto"
                            />
                          ) : (
                            <Clock
                              size={14}
                              className="text-amber-500 ml-auto"
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-6 text-center text-slate-400 text-sm">
                  No other future services.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

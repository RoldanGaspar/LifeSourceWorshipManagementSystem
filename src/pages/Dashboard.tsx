import React, { useState, useEffect } from "react";
import { Member, Song, ServicePlan, Announcement } from "../types/types";
import {
  Calendar,
  Music,
  Users,
  Bell,
  Plus,
  X,
  FileText,
  ArrowRight,
  Edit2,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { api } from "../services/api";
import { getLocalISOString } from "../utils/constants";

interface DashboardProps {
  members: Member[];
  songs: Song[];
  services: ServicePlan[];
  announcements: Announcement[];
}

type ModalType = "services" | "songs" | "members" | "alerts" | null;

export const Dashboard: React.FC<DashboardProps> = ({
  members,
  songs,
  services,
  announcements,
}) => {
  // Modal & Form State
  const [isAnnModalOpen, setIsAnnModalOpen] = useState(false);
  const [annFormData, setAnnFormData] = useState({ title: "", content: "" });
  const [editingId, setEditingId] = useState<string | null>(null);

  // Delete State
  const [announcementToDelete, setAnnouncementToDelete] =
    useState<Announcement | null>(null);

  // Card Modal State
  const [activeModal, setActiveModal] = useState<ModalType>(null);

  // Sort songs by usage for chart
  const chartData = [...songs]
    .sort((a, b) => b.usageCount - a.usageCount)
    .slice(0, 5)
    .map((s) => ({
      name: s.title ? s.title.split("(")[0].trim() : "Unknown", // Truncate for chart
      plays: s.usageCount,
    }));

  const nextService = services[0]; // Assuming sorted by date

  const openCreateModal = () => {
    setEditingId(null);
    setAnnFormData({ title: "", content: "" });
    setIsAnnModalOpen(true);
  };

  const openEditModal = (ann: Announcement) => {
    setEditingId(ann.id);
    setAnnFormData({ title: ann.title, content: ann.content });
    setIsAnnModalOpen(true);
  };

  const handleSaveAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        // Edit existing
        const original = announcements.find((a) => a.id === editingId);
        if (original) {
          await api.updateAnnouncement({
            ...original,
            title: annFormData.title,
            content: annFormData.content,
          });
        }
      } else {
        // Create new
        await api.addAnnouncement({
          title: annFormData.title,
          content: annFormData.content,
          date: getLocalISOString(),
          author: "Admin",
        });
      }
      setIsAnnModalOpen(false);
      setAnnFormData({ title: "", content: "" });
      setEditingId(null);
    } catch (e) {
      alert("Error saving announcement");
    }
  };

  const confirmDeleteAnnouncement = async () => {
    if (!announcementToDelete) return;
    try {
      await api.deleteAnnouncement(announcementToDelete.id);
      setAnnouncementToDelete(null);
    } catch (e) {
      alert("Error deleting announcement");
    }
  };

  // Handle ESC key to close modals
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setActiveModal(null);
        setIsAnnModalOpen(false);
        setAnnouncementToDelete(null);
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  const closeModal = () => setActiveModal(null);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      closeModal();
    }
  };

  return (
    <div className="space-y-6 relative">
      {/* Quick Actions & Welcome */}
      <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center bg-gradient-to-r from-slate-800 to-black rounded-xl p-6 text-white shadow-lg">
        <div>
          <h1 className="text-2xl font-bold">Worship Dashboard</h1>
          <p className="text-slate-300 opacity-90 mt-1">
            Overview of your ministry's upcoming events and resources.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-sm px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Bell size={16} />
            <span>Post Update</span>
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={() => setActiveModal("services")}
          className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center space-x-4 hover:shadow-md transition-all cursor-pointer hover:scale-105"
        >
          <div className="p-3 bg-slate-100 rounded-full text-slate-900">
            <Calendar size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">
              Upcoming Services
            </p>
            <p className="text-2xl font-bold text-slate-800">
              {services.length}
            </p>
          </div>
        </div>

        <div
          onClick={() => setActiveModal("songs")}
          className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center space-x-4 hover:shadow-md transition-all cursor-pointer hover:scale-105"
        >
          <div className="p-3 bg-rose-50 rounded-full text-rose-600">
            <Music size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Song Library</p>
            <p className="text-2xl font-bold text-slate-800">{songs.length}</p>
          </div>
        </div>

        <div
          onClick={() => setActiveModal("members")}
          className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center space-x-4 hover:shadow-md transition-all cursor-pointer hover:scale-105"
        >
          <div className="p-3 bg-emerald-50 rounded-full text-emerald-600">
            <Users size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Team Members</p>
            <p className="text-2xl font-bold text-slate-800">
              {members.length}
            </p>
          </div>
        </div>

        <div
          onClick={() => setActiveModal("alerts")}
          className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center space-x-4 hover:shadow-md transition-all cursor-pointer hover:scale-105"
        >
          <div className="p-3 bg-amber-50 rounded-full text-amber-600">
            <Bell size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Alerts</p>
            <p className="text-2xl font-bold text-slate-800">
              {announcements.length}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-6">
          {/* Next Service Card */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="bg-white px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-2 h-6 bg-black rounded-full"></div>
                <h3 className="font-bold text-lg text-slate-800">
                  Next Service
                </h3>
              </div>
              <span className="bg-slate-100 text-slate-900 px-3 py-1 rounded-full text-xs font-bold border border-slate-200 uppercase tracking-wide">
                {nextService ? nextService.date : "N/A"}
              </span>
            </div>
            <div className="p-6">
              {nextService ? (
                <div className="space-y-6">
                  <div>
                    <h4 className="text-2xl font-bold text-slate-800">
                      {nextService.title}
                    </h4>
                    <p className="text-slate-500 mt-1 flex items-center gap-2">
                      <span className="bg-slate-100 px-2 py-0.5 rounded text-xs font-mono">
                        {nextService.time}
                      </span>
                      {nextService.notes}
                    </p>
                  </div>

                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                    <h5 className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-3 flex items-center gap-2">
                      <Music size={12} /> Setlist Preview
                    </h5>
                    <ul className="space-y-3">
                      {nextService.setlist.map((item, idx) => {
                        const song = songs.find((s) => s.id === item.songId);
                        return (
                          <li
                            key={idx}
                            className="flex items-center text-sm group"
                          >
                            <span className="w-6 h-6 rounded-full bg-white border border-slate-200 text-slate-400 flex items-center justify-center mr-3 text-xs font-medium group-hover:border-slate-400 group-hover:text-black transition-colors">
                              {idx + 1}
                            </span>
                            <span className="font-semibold text-slate-700 group-hover:text-black transition-colors">
                              {song?.title || "Unknown Song"}
                            </span>
                            <span className="ml-auto text-xs font-mono bg-white border border-slate-200 px-2 py-0.5 rounded text-slate-500">
                              Key: {item.key}
                            </span>
                          </li>
                        );
                      })}
                      {nextService.setlist.length === 0 && (
                        <li className="text-slate-400 italic text-sm">
                          No songs added yet.
                        </li>
                      )}
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Calendar className="mx-auto h-12 w-12 text-slate-200 mb-2" />
                  <p className="text-slate-500 font-medium">
                    No upcoming services scheduled.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Analytics Chart */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <h3 className="font-bold text-lg text-slate-800 mb-6 flex items-center gap-2">
              <ArrowRight size={18} className="text-black" /> Top Songs This
              Month
            </h3>
            <div className="h-64 w-full" style={{ minHeight: "256px", minWidth: "200px" }}>
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#e2e8f0"
                    />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#64748b", fontSize: 12 }}
                      dy={10}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#64748b", fontSize: 12 }}
                    />
                    <Tooltip
                      cursor={{ fill: "#f1f5f9" }}
                      contentStyle={{
                        borderRadius: "8px",
                        border: "none",
                        boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                      }}
                    />
                    <Bar
                      dataKey="plays"
                      fill="#1e293b"
                      radius={[4, 4, 0, 0]}
                      barSize={40}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <Music className="mx-auto h-12 w-12 text-slate-200 mb-2" />
                    <p className="text-slate-400 text-sm">No song data yet</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar Area */}
        <div className="space-y-6">
          {/* Announcements */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg text-slate-800">
                Announcements
              </h3>
            </div>
            <div className="space-y-4">
              {announcements.map((ann) => (
                <div
                  key={ann.id}
                  className="pb-4 border-b border-slate-100 last:border-0 last:pb-0 group relative"
                >
                  <div className="flex justify-between items-start mb-1 pr-12">
                    <h4 className="font-bold text-slate-700 text-sm">
                      {ann.title}
                    </h4>
                  </div>

                  {/* Date and Actions */}
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded">
                      {ann.date}
                    </span>

                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity absolute top-0 right-0">
                      <button
                        onClick={() => openEditModal(ann)}
                        className="p-1.5 text-slate-400 hover:text-black hover:bg-slate-50 rounded"
                        title="Edit"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => setAnnouncementToDelete(ann)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-slate-50 rounded"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-slate-500 leading-relaxed mt-2">
                    {ann.content}
                  </p>
                </div>
              ))}
              {announcements.length === 0 && (
                <p className="text-slate-400 text-sm italic">
                  No announcements.
                </p>
              )}
            </div>
          </div>

          {/* Team Status */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg text-slate-800">Team Status</h3>
              <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full font-bold border border-emerald-100">
                {members.filter((m) => m.status === "Active").length} Active
              </span>
            </div>
            <div className="space-y-3">
              {members.slice(0, 5).map((member) => (
                <div
                  key={member.id}
                  className="flex items-center space-x-3 p-2 hover:bg-slate-50 rounded-lg transition-colors"
                >
                  <div className="relative">
                    <img
                      src={member.avatar}
                      alt={member.name}
                      className="w-8 h-8 rounded-full object-cover border border-slate-100"
                    />
                    <div
                      className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white ${
                        member.status === "Active"
                          ? "bg-emerald-400"
                          : "bg-amber-400"
                      }`}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-700 truncate">
                      {member.name}
                    </p>
                    <p className="text-xs text-slate-400 truncate">
                      {member.roles.join(", ")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full mt-4 py-2 text-xs font-medium text-slate-500 hover:text-black hover:bg-slate-50 rounded-lg transition-colors border border-dashed border-slate-200">
              View All Members
            </button>
          </div>
        </div>
      </div>

      {/* Services Modal */}
      {activeModal === "services" && (
        <div
          onClick={handleBackdropClick}
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-slate-50 to-white rounded-t-xl">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Calendar size={20} className="text-slate-600" />
                Upcoming Services
              </h3>
              <button
                onClick={closeModal}
                className="hover:bg-slate-100 p-1 rounded"
              >
                <X size={20} className="text-slate-400" />
              </button>
            </div>
            <div className="p-6 max-h-96 overflow-y-auto">
              {services.length > 0 ? (
                <div className="space-y-3">
                  {services.slice(0, 5).map((service) => (
                    <div
                      key={service.id}
                      className="p-4 border border-slate-200 rounded-lg hover:border-slate-300 hover:shadow-sm transition-all"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-bold text-slate-800">
                          {service.title}
                        </h4>
                        <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full font-medium">
                          Planned
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-slate-600">
                        <span className="flex items-center gap-1">
                          <Calendar size={14} />
                          {service.date}
                        </span>
                        <span className="font-mono">{service.time}</span>
                      </div>
                      {service.notes && (
                        <p className="text-xs text-slate-500 mt-2">
                          {service.notes}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Calendar className="mx-auto h-12 w-12 text-slate-200 mb-3" />
                  <p className="text-slate-500 font-medium">
                    No upcoming services scheduled.
                  </p>
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t border-slate-100 flex gap-3 bg-slate-50 rounded-b-xl">
              <button className="flex-1 flex items-center justify-center gap-2 bg-black text-white py-2.5 rounded-lg font-medium hover:bg-slate-800 transition-colors">
                <Plus size={16} />
                Create New Service
              </button>
              <button className="flex-1 flex items-center justify-center gap-2 border border-slate-300 py-2.5 rounded-lg font-medium hover:bg-white transition-colors">
                <Calendar size={16} />
                View All Services
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Songs Modal */}
      {activeModal === "songs" && (
        <div
          onClick={handleBackdropClick}
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-rose-50 to-white rounded-t-xl">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Music size={20} className="text-rose-600" />
                Song Library Overview
              </h3>
              <button
                onClick={closeModal}
                className="hover:bg-slate-100 p-1 rounded"
              >
                <X size={20} className="text-slate-400" />
              </button>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                  <p className="text-sm text-slate-500 mb-1">Total Songs</p>
                  <p className="text-2xl font-bold text-slate-800">
                    {songs.length}
                  </p>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                  <p className="text-sm text-slate-500 mb-1">Recently Added</p>
                  <p className="text-2xl font-bold text-slate-800">
                    {
                      songs.filter((s) => {
                        const sevenDaysAgo = new Date();
                        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
                        return new Date(s.dateAdded || 0) > sevenDaysAgo;
                      }).length
                    }
                  </p>
                </div>
              </div>

              <h4 className="text-sm font-bold text-slate-600 mb-3 uppercase tracking-wide">
                Recently Added Songs
              </h4>
              {songs.length > 0 ? (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {songs.slice(0, 5).map((song) => (
                    <div
                      key={song.id}
                      className="p-3 border border-slate-200 rounded-lg hover:border-rose-300 hover:bg-rose-50/50 transition-all"
                    >
                      <h5 className="font-bold text-slate-800 text-sm mb-1">
                        {song.title}
                      </h5>
                      <div className="flex gap-2 text-xs">
                        <span className="bg-white border border-slate-200 px-2 py-0.5 rounded font-mono">
                          Key: {song.key}
                        </span>
                        <span className="bg-white border border-slate-200 px-2 py-0.5 rounded font-mono">
                          {song.tempo} BPM
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Music className="mx-auto h-12 w-12 text-slate-200 mb-3" />
                  <p className="text-slate-500">
                    Your song library is empty. Start by adding your first song.
                  </p>
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t border-slate-100 flex gap-3 bg-slate-50 rounded-b-xl">
              <button className="flex-1 flex items-center justify-center gap-2 bg-rose-600 text-white py-2.5 rounded-lg font-medium hover:bg-rose-700 transition-colors">
                <Plus size={16} />
                Add New Song
              </button>
              <button className="flex-1 flex items-center justify-center gap-2 border border-slate-300 py-2.5 rounded-lg font-medium hover:bg-white transition-colors">
                <Music size={16} />
                Open Song Library
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Members Modal */}
      {activeModal === "members" && (
        <div
          onClick={handleBackdropClick}
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-emerald-50 to-white rounded-t-xl">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Users size={20} className="text-emerald-600" />
                Team Members
              </h3>
              <button
                onClick={closeModal}
                className="hover:bg-slate-100 p-1 rounded"
              >
                <X size={20} className="text-slate-400" />
              </button>
            </div>
            <div className="p-6 max-h-96 overflow-y-auto">
              {members.length > 0 ? (
                <div className="space-y-3">
                  {members.slice(0, 5).map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center gap-4 p-4 border border-slate-200 rounded-lg hover:border-emerald-300 hover:bg-emerald-50/30 transition-all"
                    >
                      <div className="relative">
                        <img
                          src={member.avatar}
                          alt={member.name}
                          className="w-12 h-12 rounded-full object-cover border-2 border-slate-100"
                        />
                        <div
                          className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                            member.status === "Active"
                              ? "bg-emerald-400"
                              : "bg-amber-400"
                          }`}
                        />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-slate-800">
                          {member.name}
                        </h4>
                        <p className="text-sm text-slate-500">
                          {member.roles.join(", ")}
                        </p>
                      </div>
                      <span
                        className={`text-xs px-2 py-1 rounded-full font-medium ${
                          member.status === "Active"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {member.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="mx-auto h-12 w-12 text-slate-200 mb-3" />
                  <p className="text-slate-500">
                    Your team is just getting started.
                  </p>
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t border-slate-100 flex gap-3 bg-slate-50 rounded-b-xl">
              <button className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 text-white py-2.5 rounded-lg font-medium hover:bg-emerald-700 transition-colors">
                <Plus size={16} />
                Invite Member
              </button>
              <button className="flex-1 flex items-center justify-center gap-2 border border-slate-300 py-2.5 rounded-lg font-medium hover:bg-white transition-colors">
                <Users size={16} />
                Manage Team
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Alerts Modal */}
      {activeModal === "alerts" && (
        <div
          onClick={handleBackdropClick}
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-amber-50 to-white rounded-t-xl">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Bell size={20} className="text-amber-600" />
                Recent Alerts
              </h3>
              <button
                onClick={closeModal}
                className="hover:bg-slate-100 p-1 rounded"
              >
                <X size={20} className="text-slate-400" />
              </button>
            </div>
            <div className="p-6 max-h-96 overflow-y-auto">
              {announcements.length > 0 ? (
                <div className="space-y-3">
                  {announcements.slice(0, 5).map((ann) => (
                    <div
                      key={ann.id}
                      className="p-4 border border-slate-200 rounded-lg hover:border-amber-300 hover:bg-amber-50/30 transition-all"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-bold text-slate-800">
                          {ann.title}
                        </h4>
                        <span className="w-2 h-2 bg-amber-500 rounded-full flex-shrink-0 mt-1.5"></span>
                      </div>
                      <p className="text-sm text-slate-600 mb-2">
                        {ann.content}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-400 font-mono">
                          {ann.date}
                        </span>
                        <span className="text-xs text-slate-500">
                          {ann.author}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Bell className="mx-auto h-12 w-12 text-slate-200 mb-3" />
                  <p className="text-slate-500 font-medium">
                    You're all caught up! No new alerts.
                  </p>
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t border-slate-100 flex gap-3 bg-slate-50 rounded-b-xl">
              {announcements.length > 0 && (
                <button className="flex-1 flex items-center justify-center gap-2 border border-slate-300 py-2.5 rounded-lg font-medium hover:bg-white transition-colors">
                  Mark All as Read
                </button>
              )}
              <button className="flex-1 flex items-center justify-center gap-2 bg-amber-600 text-white py-2.5 rounded-lg font-medium hover:bg-amber-700 transition-colors">
                <Bell size={16} />
                View All Alerts
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Announcement Modal */}
      {isAnnModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-xl">
              <h3 className="font-bold text-slate-800">
                {editingId ? "Edit Announcement" : "New Announcement"}
              </h3>
              <button onClick={() => setIsAnnModalOpen(false)}>
                <X size={20} className="text-slate-400" />
              </button>
            </div>
            <form onSubmit={handleSaveAnnouncement} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Title
                </label>
                <input
                  required
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-slate-500"
                  value={annFormData.title}
                  onChange={(e) =>
                    setAnnFormData({ ...annFormData, title: e.target.value })
                  }
                  placeholder="Rehearsal Canceled"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Content
                </label>
                <textarea
                  required
                  className="w-full px-3 py-2 border rounded-lg h-24 focus:ring-2 focus:ring-slate-500"
                  value={annFormData.content}
                  onChange={(e) =>
                    setAnnFormData({ ...annFormData, content: e.target.value })
                  }
                />
              </div>
              <button
                type="submit"
                className="w-full bg-black text-white py-2 rounded-lg font-medium mt-2 hover:bg-slate-800 transition-colors"
              >
                {editingId ? "Save Changes" : "Post Announcement"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Delete Announcement Modal */}
      {announcementToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden">
            <div className="p-6 text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="text-red-600" size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">
                Delete Announcement?
              </h3>
              <p className="text-slate-500 text-sm mb-6">
                Are you sure you want to delete{" "}
                <strong>{announcementToDelete.title}</strong>? This action
                cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setAnnouncementToDelete(null)}
                  className="flex-1 py-2.5 border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteAnnouncement}
                  className="flex-1 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors shadow-sm"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState, useEffect } from "react";
import {
  ServicePlan,
  Song,
  Member,
  Role,
  AssignmentStatus,
} from "../types/types";
import {
  Calendar as CalendarIcon,
  Clock,
  ChevronRight,
  User,
  Trash2,
  Plus,
  GripVertical,
  List,
  LayoutGrid,
  CheckCircle2,
  AlertCircle,
  XCircle,
  MapPin,
  AlertTriangle,
  X,
  Save,
  ArrowUp,
  ArrowDown,
  Printer,
} from "lucide-react";
import { CalendarView } from "../components/CalendarView";
import { api } from "../services/api";
import { useToast } from "../components/Toast";
import { getLocalISOString } from "../utils/constants";

interface ServicePlannerProps {
  services: ServicePlan[];
  songs: Song[];
  members: Member[];
  isReadOnly?: boolean;
}

export const ServicePlanner: React.FC<ServicePlannerProps> = ({
  services,
  songs,
  members,
  isReadOnly = false,
}) => {
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const [selectedServiceId, setSelectedServiceId] = useState<string>("");
  const { showToast } = useToast();

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAddSongOpen, setIsAddSongOpen] = useState(false);
  const [isAddTeamOpen, setIsAddTeamOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Forms
  const [newServiceData, setNewServiceData] = useState({
    title: "",
    date: "",
    time: "10:00",
    hasRehearsal: false,
    rehearsalDate: "",
    rehearsalTime: "",
    rehearsalLocation: "",
  });
  const [newSongSelection, setNewSongSelection] = useState({
    songId: "",
    key: "",
    note: "",
  });
  const [newTeamSelection, setNewTeamSelection] = useState({
    role: Role.Vocalist,
    memberId: "",
  });

  // Conflict State
  const [conflictWarning, setConflictWarning] = useState<string | null>(null);

  // Auto-select first service on load
  useEffect(() => {
    if (services.length > 0 && !selectedServiceId) {
      setSelectedServiceId(services[0].id);
    }
  }, [services, selectedServiceId]);

  const selectedService = services.find((s) => s.id === selectedServiceId);

  // Helper to find details
  const getSong = (id: string) => songs.find((s) => s.id === id);
  const getMember = (id: string | null) =>
    id ? members.find((m) => m.id === id) : null;

  const handleServiceSelectFromCalendar = (id: string) => {
    setSelectedServiceId(id);
    setViewMode("list");
  };

  const getMemberUnavailability = (member: Member, date: string) => {
    return member.unavailableDates.find((d) => d.date === date);
  };

  const checkDoubleBooking = (memberId: string): string | null => {
    if (!selectedService || !memberId) return null;

    // Check other services on same date
    const otherServicesOnDate = services.filter(
      (s) => s.date === selectedService.date && s.id !== selectedService.id
    );

    for (const s of otherServicesOnDate) {
      const isAssigned = s.team.some((t) => t.memberId === memberId);
      if (isAssigned) {
        return `Assigned to "${s.title}" at ${s.time}`;
      }
    }
    return null;
  };

  // Watch for member selection to check conflicts
  useEffect(() => {
    if (newTeamSelection.memberId) {
      const conflict = checkDoubleBooking(newTeamSelection.memberId);
      setConflictWarning(conflict);
    } else {
      setConflictWarning(null);
    }
  }, [newTeamSelection.memberId]);

  const getStatusColor = (status: AssignmentStatus) => {
    switch (status) {
      case "Confirmed":
        return "text-green-600 bg-green-50 border-green-200";
      case "Declined":
        return "text-red-600 bg-red-50 border-red-200";
      default:
        return "text-amber-600 bg-amber-50 border-amber-200";
    }
  };

  const getStatusIcon = (status: AssignmentStatus) => {
    switch (status) {
      case "Confirmed":
        return <CheckCircle2 size={14} />;
      case "Declined":
        return <XCircle size={14} />;
      default:
        return <Clock size={14} />;
    }
  };

  // --- Actions ---

  const openCreateModal = () => {
    setNewServiceData({
      title: "",
      date: getLocalISOString(),
      time: "10:00",
      hasRehearsal: false,
      rehearsalDate: "",
      rehearsalTime: "",
      rehearsalLocation: "",
    });
    setIsCreateModalOpen(true);
  };

  const handleCreateService = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const serviceData: Omit<ServicePlan, "id"> = {
        title: newServiceData.title,
        date: newServiceData.date,
        time: newServiceData.time,
        team: [],
        setlist: [],
        notes: "",
      };

      if (newServiceData.hasRehearsal) {
        serviceData.rehearsal = {
          date: newServiceData.rehearsalDate || newServiceData.date,
          time: newServiceData.rehearsalTime || "19:00",
          location: newServiceData.rehearsalLocation || "Main Sanctuary",
        };
      }

      await api.addService(serviceData);
      showToast("Service created successfully", "success");
      setIsCreateModalOpen(false);
    } catch (error) {
      console.error(error);
      showToast("Failed to create service", "error");
    }
  };

  const handleDeleteServiceClick = () => {
    if (!selectedService) return;
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteService = async () => {
    if (!selectedService) return;
    try {
      await api.deleteService(selectedService.id);
      showToast("Service deleted", "info");
      setSelectedServiceId("");
      setIsDeleteModalOpen(false);
    } catch (e) {
      showToast("Failed to delete service", "error");
    }
  };

  const handleAddSong = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService || !newSongSelection.songId) return;

    const updatedSetlist = [
      ...selectedService.setlist,
      {
        songId: newSongSelection.songId,
        key:
          newSongSelection.key ||
          getSong(newSongSelection.songId)?.originalKey ||
          "",
        note: newSongSelection.note,
      },
    ];

    await api.updateService({ ...selectedService, setlist: updatedSetlist });
    showToast("Song added to setlist", "success");
    setIsAddSongOpen(false);
    setNewSongSelection({ songId: "", key: "", note: "" });
  };

  const handleMoveSong = async (index: number, direction: "up" | "down") => {
    if (!selectedService) return;
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= selectedService.setlist.length) return;

    const updatedSetlist = [...selectedService.setlist];
    const [movedItem] = updatedSetlist.splice(index, 1);
    updatedSetlist.splice(newIndex, 0, movedItem);

    await api.updateService({ ...selectedService, setlist: updatedSetlist });
  };

  const handleRemoveSong = async (index: number) => {
    if (!selectedService) return;
    const updatedSetlist = [...selectedService.setlist];
    updatedSetlist.splice(index, 1);
    await api.updateService({ ...selectedService, setlist: updatedSetlist });
    showToast("Song removed from setlist", "info");
  };

  const handleAddTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService) return;

    const updatedTeam = [
      ...selectedService.team,
      {
        role: newTeamSelection.role as Role,
        memberId: newTeamSelection.memberId || null,
        status: "Pending" as AssignmentStatus,
      },
    ];

    await api.updateService({ ...selectedService, team: updatedTeam });
    showToast("Team member added", "success");
    setIsAddTeamOpen(false);
    setNewTeamSelection({ role: Role.Vocalist, memberId: "" });
    setConflictWarning(null);
  };

  const handleRemoveTeam = async (index: number) => {
    if (!selectedService) return;
    const updatedTeam = [...selectedService.team];
    updatedTeam.splice(index, 1);
    await api.updateService({ ...selectedService, team: updatedTeam });
    showToast("Team position removed", "info");
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] gap-4">
      {/* View Toggle Header */}
      <div className="flex justify-between items-center mb-2">
        <div className="flex bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
          <button
            onClick={() => setViewMode("list")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              viewMode === "list"
                ? "bg-slate-100 text-slate-900"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <List size={16} />
            <span>List View</span>
          </button>
          <button
            onClick={() => setViewMode("calendar")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              viewMode === "calendar"
                ? "bg-slate-100 text-slate-900"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <LayoutGrid size={16} />
            <span>Calendar Dashboard</span>
          </button>
        </div>
        {viewMode === "list" && !isReadOnly && (
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors shadow-sm"
          >
            <Plus size={16} />
            <span>New Service</span>
          </button>
        )}
      </div>

      {viewMode === "calendar" ? (
        <CalendarView
          services={services}
          onSelectService={handleServiceSelectFromCalendar}
        />
      ) : (
        <div className="flex flex-1 gap-6 overflow-hidden">
          {/* Sidebar List */}
          <div className="w-full md:w-80 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col">
            <div className="p-4 border-b border-slate-100">
              <h2 className="font-bold text-slate-800">Services</h2>
            </div>
            <div className="flex-1 overflow-y-auto">
              {services.length === 0 && (
                <div className="p-4 text-slate-400 text-sm">
                  No recent services found.
                </div>
              )}
              {services.map((service) => (
                <div
                  key={service.id}
                  onClick={() => setSelectedServiceId(service.id)}
                  className={`p-4 border-b border-slate-50 cursor-pointer hover:bg-slate-50 transition-colors ${
                    selectedServiceId === service.id
                      ? "bg-slate-100 border-slate-300"
                      : ""
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                      {service.date}
                    </span>
                    {selectedServiceId === service.id && (
                      <ChevronRight size={14} className="text-black" />
                    )}
                  </div>
                  <h3
                    className={`font-medium ${
                      selectedServiceId === service.id
                        ? "text-black"
                        : "text-slate-700"
                    }`}
                  >
                    {service.title}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 truncate">
                    {service.setlist.length} songs • {service.team.length} team
                    members
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Main Plan Area */}
          {selectedService ? (
            <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
              {/* Header */}
              <div className="px-8 py-6 border-b border-slate-100">
                <div className="flex justify-between items-start">
                  <div>
                    <h1 className="text-2xl font-bold text-slate-800">
                      {selectedService.title}
                    </h1>
                    <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-slate-500">
                      <span className="flex items-center gap-1.5 bg-slate-100 px-2 py-1 rounded text-slate-600">
                        <CalendarIcon size={14} /> {selectedService.date}
                      </span>
                      <span className="flex items-center gap-1.5 bg-slate-100 px-2 py-1 rounded text-slate-600">
                        <Clock size={14} /> {selectedService.time}
                      </span>
                      {selectedService.rehearsal && (
                        <span className="flex items-center gap-1.5 bg-amber-50 text-amber-700 border border-amber-100 px-2 py-1 rounded">
                          <Clock size={14} /> Rehearsal:{" "}
                          {selectedService.rehearsal.date ===
                          selectedService.date
                            ? "Same day"
                            : selectedService.rehearsal.date}{" "}
                          @ {selectedService.rehearsal.time}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setIsPrintModalOpen(true)}
                      className="px-3 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-50 flex items-center gap-2"
                      title="Print Run Sheet"
                    >
                      <Printer size={16} />
                      <span className="hidden sm:inline">Print</span>
                    </button>
                    {!isReadOnly && (
                      <button
                        onClick={handleDeleteServiceClick}
                        className="px-3 py-2 bg-white border border-red-200 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50"
                        title="Delete Service"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
                {selectedService.notes && (
                  <div className="mt-4 bg-blue-50 border border-blue-100 text-blue-800 px-4 py-3 rounded-lg text-sm flex items-start gap-2">
                    <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                    <span>
                      <strong>Note:</strong> {selectedService.notes}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex-1 overflow-y-auto p-8">
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-12">
                  {/* Setlist Section */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-end mb-2">
                      <h3 className="font-bold text-slate-800 text-lg">
                        Order of Service
                      </h3>
                      {!isReadOnly && (
                        <button
                          onClick={() => setIsAddSongOpen(true)}
                          className="text-sm text-black font-medium hover:underline flex items-center gap-1"
                        >
                          <Plus size={14} /> Add Item
                        </button>
                      )}
                    </div>

                    <div className="space-y-3">
                      {selectedService.setlist.map((item, idx) => {
                        const song = getSong(item.songId);
                        return (
                          <div
                            key={idx}
                            className={`group flex items-start gap-3 p-3 rounded-lg border border-slate-200 bg-white transition-all ${
                              isReadOnly
                                ? ""
                                : "hover:border-slate-400 hover:shadow-sm"
                            }`}
                          >
                            {!isReadOnly && (
                              <div className="mt-2 text-slate-300 flex flex-col gap-1">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleMoveSong(idx, "up");
                                  }}
                                  className={`hover:text-black ${
                                    idx === 0
                                      ? "opacity-20 pointer-events-none"
                                      : ""
                                  }`}
                                >
                                  <ArrowUp size={14} />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleMoveSong(idx, "down");
                                  }}
                                  className={`hover:text-black ${
                                    idx === selectedService.setlist.length - 1
                                      ? "opacity-20 pointer-events-none"
                                      : ""
                                  }`}
                                >
                                  <ArrowDown size={14} />
                                </button>
                              </div>
                            )}
                            <div className="flex-1">
                              <div className="flex justify-between items-center">
                                <h4 className="font-semibold text-slate-700">
                                  {song?.title || "Unknown Song"}
                                </h4>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-mono bg-slate-100 px-2 py-0.5 rounded border border-slate-200 text-slate-600">
                                    Key: {item.key}
                                  </span>
                                  {!isReadOnly && (
                                    <button
                                      onClick={() => handleRemoveSong(idx)}
                                      className="text-slate-300 hover:text-red-500 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  )}
                                </div>
                              </div>
                              <p className="text-xs text-slate-500 mt-0.5">
                                {song?.artist}
                              </p>
                              {item.note && (
                                <p className="text-xs text-slate-600 mt-2 bg-slate-100 inline-block px-2 py-0.5 rounded">
                                  {item.note}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}

                      {!isReadOnly && (
                        <div
                          onClick={() => setIsAddSongOpen(true)}
                          className="border-2 border-dashed border-slate-200 rounded-lg p-3 flex justify-center items-center text-slate-400 text-sm hover:border-slate-400 hover:bg-slate-50 cursor-pointer transition-all"
                        >
                          + Add song to setlist
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Team Section */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-end mb-2">
                      <h3 className="font-bold text-slate-800 text-lg">
                        Team Schedule
                      </h3>
                      {!isReadOnly && (
                        <button
                          onClick={() => setIsAddTeamOpen(true)}
                          className="text-sm text-black font-medium hover:underline flex items-center gap-1"
                        >
                          <Plus size={14} /> Add Position
                        </button>
                      )}
                    </div>

                    <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-4">
                      {selectedService.team.map((position, idx) => {
                        const member = getMember(position.memberId);
                        const unavailability = member
                          ? getMemberUnavailability(
                              member,
                              selectedService.date
                            )
                          : undefined;
                        const isUnavailable = !!unavailability;

                        return (
                          <div
                            key={idx}
                            className="flex flex-col sm:flex-row sm:items-center justify-between py-3 border-b border-slate-200 last:border-0 gap-3 group relative"
                          >
                            <div className="flex items-center gap-3">
                              <div className="bg-white p-2 rounded-full border border-slate-200 text-slate-500">
                                <User size={16} />
                              </div>
                              <div>
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-2">
                                  {position.role}
                                  {isUnavailable && (
                                    <span
                                      className="text-red-500 flex items-center gap-0.5 cursor-help"
                                      title={
                                        unavailability?.reason
                                          ? `Unavailable: ${unavailability.reason}`
                                          : "Member marked unavailable for this date"
                                      }
                                    >
                                      <AlertTriangle size={12} />
                                      <span className="text-[10px] normal-case">
                                        Unavailable
                                      </span>
                                    </span>
                                  )}
                                </p>
                                {member ? (
                                  <p
                                    className={`text-sm font-medium ${
                                      !isUnavailable
                                        ? "text-slate-800"
                                        : "text-slate-400 line-through decoration-red-500"
                                    }`}
                                  >
                                    {member.name}
                                  </p>
                                ) : (
                                  <p className="text-sm font-medium text-slate-400 italic">
                                    Unassigned
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 ml-11 sm:ml-0">
                              {member ? (
                                <button
                                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${getStatusColor(
                                    position.status
                                  )}`}
                                >
                                  {getStatusIcon(position.status)}
                                  <span>{position.status}</span>
                                </button>
                              ) : (
                                <span className="text-xs text-slate-400 italic">
                                  Open
                                </span>
                              )}
                              {!isReadOnly && (
                                <button
                                  onClick={() => handleRemoveTeam(idx)}
                                  className="text-slate-300 hover:text-red-500 p-1 ml-2"
                                >
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                      {selectedService.team.length === 0 && (
                        <div className="text-slate-400 text-sm italic text-center py-2">
                          No team members assigned
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-400">
              <div className="text-center">
                <LayoutGrid size={48} className="mx-auto mb-3 opacity-20" />
                <p>Select a service to view details</p>
                {!isReadOnly && (
                  <button
                    onClick={openCreateModal}
                    className="mt-4 text-black hover:underline text-sm"
                  >
                    Or create a new one
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* --- MODALS --- */}

      {/* Print Run Sheet Modal */}
      {isPrintModalOpen && selectedService && (
        <div className="fixed inset-0 z-[60] bg-white flex flex-col">
          <div className="p-4 border-b border-slate-200 flex justify-between items-center print:hidden bg-slate-50">
            <h2 className="font-bold text-lg text-slate-800">Print Preview</h2>
            <div className="flex gap-3">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-black text-white rounded-lg font-medium hover:bg-slate-800 flex items-center gap-2 shadow-sm"
              >
                <Printer size={18} /> Print Now
              </button>
              <button
                onClick={() => setIsPrintModalOpen(false)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-white"
              >
                Close
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-8 md:p-12 print:p-0 print:overflow-visible bg-slate-100 print:bg-white">
            <div className="max-w-4xl mx-auto bg-white shadow-xl print:shadow-none p-10 print:p-0 rounded-xl print:rounded-none min-h-[1000px] print:min-h-0">
              {/* Print Header */}
              <div className="border-b-2 border-slate-800 pb-6 mb-8 flex justify-between items-end">
                <div>
                  <h1 className="text-3xl font-extrabold text-slate-900 uppercase tracking-tight">
                    {selectedService.title}
                  </h1>
                  <div className="mt-2 text-slate-600 font-medium flex gap-6">
                    <span className="flex items-center gap-2">
                      {selectedService.date}
                    </span>
                    <span className="flex items-center gap-2">
                      {selectedService.time}
                    </span>
                  </div>
                </div>
                {selectedService.rehearsal && (
                  <div className="text-right">
                    <p className="text-xs uppercase font-bold text-slate-500 tracking-wider mb-1">
                      Rehearsal
                    </p>
                    <p className="font-medium text-slate-800">
                      {selectedService.rehearsal.time} @{" "}
                      {selectedService.rehearsal.location}
                    </p>
                  </div>
                )}
              </div>

              {selectedService.notes && (
                <div className="mb-8 p-4 bg-slate-50 border-l-4 border-slate-400 rounded-r text-slate-700 italic text-sm">
                  <strong>Note:</strong> {selectedService.notes}
                </div>
              )}

              {/* Print Layout Grid */}
              <div className="grid grid-cols-3 gap-8">
                {/* Left: Setlist (2/3 width) */}
                <div className="col-span-2">
                  <h3 className="text-sm font-bold uppercase text-slate-400 tracking-wider mb-4 border-b border-slate-200 pb-2">
                    Order of Service
                  </h3>
                  <table className="w-full text-left">
                    <thead className="text-xs text-slate-500 uppercase border-b border-slate-200">
                      <tr>
                        <th className="py-2 w-10">#</th>
                        <th className="py-2">Item</th>
                        <th className="py-2 w-16 text-center">Key</th>
                        <th className="py-2 w-1/3">Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                      {selectedService.setlist.map((item, idx) => {
                        const song = getSong(item.songId);
                        return (
                          <tr key={idx} className="group">
                            <td className="py-3 font-medium text-slate-400">
                              {idx + 1}
                            </td>
                            <td className="py-3 pr-4">
                              <div className="font-bold text-slate-800 text-base">
                                {song?.title || "Unknown Song"}
                              </div>
                              <div className="text-xs text-slate-500">
                                {song?.artist}
                              </div>
                            </td>
                            <td className="py-3 text-center font-mono font-bold text-slate-700 bg-slate-50 rounded">
                              {item.key}
                            </td>
                            <td className="py-3 pl-4 italic text-slate-600">
                              {item.note}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Right: Team (1/3 width) */}
                <div className="col-span-1">
                  <h3 className="text-sm font-bold uppercase text-slate-400 tracking-wider mb-4 border-b border-slate-200 pb-2">
                    Roster
                  </h3>
                  <ul className="space-y-4">
                    {selectedService.team.map((pos, idx) => {
                      const member = getMember(pos.memberId);
                      return (
                        <li key={idx} className="flex flex-col">
                          <span className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-0.5">
                            {pos.role}
                          </span>
                          <span
                            className={`font-semibold text-base ${
                              member
                                ? "text-slate-800"
                                : "text-slate-400 italic"
                            }`}
                          >
                            {member ? member.name : "Unassigned"}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>

              <div className="mt-12 border-t border-slate-200 pt-6 text-center text-xs text-slate-400">
                Generated by LSMIsystem • {new Date().toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Service Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-slate-800">New Service</h3>
              <button onClick={() => setIsCreateModalOpen(false)}>
                <X size={20} className="text-slate-400" />
              </button>
            </div>
            <form onSubmit={handleCreateService} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Title
                </label>
                <input
                  required
                  className="w-full px-3 py-2 border rounded-lg"
                  value={newServiceData.title}
                  onChange={(e) =>
                    setNewServiceData({
                      ...newServiceData,
                      title: e.target.value,
                    })
                  }
                  placeholder="Sunday Service"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    required
                    className="w-full px-3 py-2 border rounded-lg"
                    value={newServiceData.date}
                    onChange={(e) =>
                      setNewServiceData({
                        ...newServiceData,
                        date: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Time
                  </label>
                  <input
                    type="time"
                    required
                    className="w-full px-3 py-2 border rounded-lg"
                    value={newServiceData.time}
                    onChange={(e) =>
                      setNewServiceData({
                        ...newServiceData,
                        time: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4">
                <div className="flex items-center gap-2 mb-3">
                  <input
                    type="checkbox"
                    id="hasRehearsal"
                    checked={newServiceData.hasRehearsal}
                    onChange={(e) =>
                      setNewServiceData({
                        ...newServiceData,
                        hasRehearsal: e.target.checked,
                      })
                    }
                    className="rounded text-slate-600 focus:ring-slate-500"
                  />
                  <label
                    htmlFor="hasRehearsal"
                    className="text-sm font-medium text-slate-700"
                  >
                    Schedule Rehearsal
                  </label>
                </div>

                {newServiceData.hasRehearsal && (
                  <div className="space-y-3 pl-6 border-l-2 border-slate-100">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">
                          Date
                        </label>
                        <input
                          type="date"
                          className="w-full px-3 py-2 border rounded-lg text-sm"
                          value={newServiceData.rehearsalDate}
                          onChange={(e) =>
                            setNewServiceData({
                              ...newServiceData,
                              rehearsalDate: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">
                          Time
                        </label>
                        <input
                          type="time"
                          className="w-full px-3 py-2 border rounded-lg text-sm"
                          value={newServiceData.rehearsalTime}
                          onChange={(e) =>
                            setNewServiceData({
                              ...newServiceData,
                              rehearsalTime: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">
                        Location
                      </label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border rounded-lg text-sm"
                        placeholder="Main Sanctuary"
                        value={newServiceData.rehearsalLocation}
                        onChange={(e) =>
                          setNewServiceData({
                            ...newServiceData,
                            rehearsalLocation: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="w-full bg-black text-white py-2 rounded-lg font-medium mt-2"
              >
                Create Service
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Add Song Modal */}
      {isAddSongOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-slate-800">Add Song to Setlist</h3>
              <button onClick={() => setIsAddSongOpen(false)}>
                <X size={20} className="text-slate-400" />
              </button>
            </div>
            <form onSubmit={handleAddSong} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Select Song
                </label>
                <select
                  required
                  className="w-full px-3 py-2 border rounded-lg"
                  value={newSongSelection.songId}
                  onChange={(e) =>
                    setNewSongSelection({
                      ...newSongSelection,
                      songId: e.target.value,
                    })
                  }
                >
                  <option value="">-- Choose a song --</option>
                  {songs.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.title} ({s.originalKey})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Key (Optional)
                </label>
                <input
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Leave blank for original"
                  value={newSongSelection.key}
                  onChange={(e) =>
                    setNewSongSelection({
                      ...newSongSelection,
                      key: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Note (Optional)
                </label>
                <input
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="e.g. Bridge x2"
                  value={newSongSelection.note}
                  onChange={(e) =>
                    setNewSongSelection({
                      ...newSongSelection,
                      note: e.target.value,
                    })
                  }
                />
              </div>
              <button
                type="submit"
                className="w-full bg-black text-white py-2 rounded-lg font-medium mt-2"
              >
                Add to Setlist
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Add Team Modal */}
      {isAddTeamOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-slate-800">Add Team Position</h3>
              <button onClick={() => setIsAddTeamOpen(false)}>
                <X size={20} className="text-slate-400" />
              </button>
            </div>
            <form onSubmit={handleAddTeam} className="p-6 space-y-4">
              {conflictWarning && (
                <div className="bg-amber-50 text-amber-800 px-4 py-3 rounded-lg text-sm border border-amber-200 flex items-start gap-2">
                  <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-bold">Conflict Detected:</span>
                    <p className="text-xs mt-0.5">{conflictWarning}</p>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Role
                </label>
                <select
                  required
                  className="w-full px-3 py-2 border rounded-lg"
                  value={newTeamSelection.role}
                  onChange={(e) =>
                    setNewTeamSelection({
                      ...newTeamSelection,
                      role: e.target.value as Role,
                    })
                  }
                >
                  {Object.values(Role).map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Member (Optional)
                </label>
                <select
                  className="w-full px-3 py-2 border rounded-lg"
                  value={newTeamSelection.memberId}
                  onChange={(e) =>
                    setNewTeamSelection({
                      ...newTeamSelection,
                      memberId: e.target.value,
                    })
                  }
                >
                  <option value="">-- Unassigned --</option>
                  {members.map((m) => {
                    const unavailable = getMemberUnavailability(
                      m,
                      selectedService?.date || ""
                    );
                    return (
                      <option key={m.id} value={m.id}>
                        {m.name} {unavailable ? "(Unavailable)" : ""}
                      </option>
                    );
                  })}
                </select>
              </div>
              <button
                type="submit"
                className="w-full bg-black text-white py-2 rounded-lg font-medium mt-2"
              >
                Add Position
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden">
            <div className="p-6 text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="text-red-600" size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">
                Delete Service?
              </h3>
              <p className="text-slate-500 text-sm mb-6">
                Are you sure you want to delete this service? This action cannot
                be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="flex-1 py-2.5 border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteService}
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

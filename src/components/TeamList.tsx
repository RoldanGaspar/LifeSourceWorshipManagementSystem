import React, { useState, useRef, useEffect, useMemo } from "react";
import { Member, Role, SystemRole } from "../types/types";
import {
  Search,
  Plus,
  Filter,
  Mail,
  Edit2,
  ChevronDown,
  Check,
  X,
  Shield,
  Save,
  Send,
  Copy,
  Loader2,
  Trash2,
  AlertTriangle,
  CalendarOff,
  LayoutList,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  UserX,
  User,
} from "lucide-react";
import { api } from "../services/api";
import { useToast } from "./Toast";

interface TeamListProps {
  members: Member[];
  isReadOnly?: boolean;
}

export const TeamList: React.FC<TeamListProps> = ({
  members,
  isReadOnly = false,
}) => {
  const [viewMode, setViewMode] = useState<"roster" | "availability">("roster");

  // Roster State
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRoles, setSelectedRoles] = useState<Role[]>([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  // Availability View State
  const [currentMonthDate, setCurrentMonthDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
      2,
      "0"
    )}-${String(d.getDate()).padStart(2, "0")}`;
  });

  // Unavailability Management Modal State
  const [unavailableModal, setUnavailableModal] = useState<{
    isOpen: boolean;
    memberId: string;
    reason: string;
    mode: "add" | "edit";
  }>({ isOpen: false, memberId: "", reason: "", mode: "add" });

  const { showToast } = useToast();

  // Edit Member State
  const [editingMember, setEditingMember] = useState<Member | null>(null);

  // Invite State
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteRoles, setInviteRoles] = useState<Role[]>([]);
  const [isInviting, setIsInviting] = useState(false);

  // Delete State
  const [memberToDelete, setMemberToDelete] = useState<Member | null>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        filterRef.current &&
        !filterRef.current.contains(event.target as Node)
      ) {
        setIsFilterOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Calculate counts for each role to display in filter
  const roleCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    Object.values(Role).forEach((r) => {
      counts[r] = members.filter((m) => m.roles.includes(r)).length;
    });
    return counts;
  }, [members]);

  // Helper to get today's date string YYYY-MM-DD
  const todayStr = useMemo(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }, []);

  const toggleRole = (role: Role) => {
    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  const handleEditRoleToggle = (role: Role) => {
    if (!editingMember) return;
    const currentRoles = editingMember.roles;
    const newRoles = currentRoles.includes(role)
      ? currentRoles.filter((r) => r !== role)
      : [...currentRoles, role];
    setEditingMember({ ...editingMember, roles: newRoles });
  };

  const handleInviteRoleToggle = (role: Role) => {
    setInviteRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  const handleSaveMember = async () => {
    if (editingMember) {
      await api.updateMember(editingMember);
      setEditingMember(null);
      showToast("Member updated successfully", "success");
    }
  };

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsInviting(true);

    try {
      // 1. Create a pending member in Firestore
      await api.inviteMember({
        name: inviteName || "Pending User",
        email: inviteEmail,
        roles: inviteRoles,
        systemRole: "Member",
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(
          inviteName || "New User"
        )}&background=random`,
        status: "Inactive",
        unavailableDates: [],
      });

      // 2. Open Email Client
      const subject = "Join the LSMIsystem Worship Team";
      const body = `Hi ${inviteName},\n\nI'd like to invite you to join our worship team management platform. Please create an account here:\n\n${window.location.origin}\n\nThanks!`;
      window.location.href = `mailto:${inviteEmail}?subject=${encodeURIComponent(
        subject
      )}&body=${encodeURIComponent(body)}`;

      showToast("Invitation recorded and email client opened", "success");
      setIsInviteModalOpen(false);
      setInviteEmail("");
      setInviteName("");
      setInviteRoles([]);
    } catch (error) {
      console.error(error);
      showToast("Failed to create invitation record", "error");
    } finally {
      setIsInviting(false);
    }
  };

  const confirmDeleteMember = async () => {
    if (!memberToDelete) return;
    try {
      await api.deleteMember(memberToDelete.id);
      showToast("Member removed successfully", "success");
      setMemberToDelete(null);
    } catch (error) {
      console.error(error);
      showToast("Failed to remove member", "error");
    }
  };

  const copyInviteLink = () => {
    navigator.clipboard.writeText(window.location.origin);
    showToast("App URL copied to clipboard", "success");
  };

  const filteredMembers = members.filter((member) => {
    const matchesSearch =
      member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole =
      selectedRoles.length === 0 ||
      member.roles.some((r) => selectedRoles.includes(r));
    return matchesSearch && matchesRole;
  });

  const getFilterLabel = () => {
    if (selectedRoles.length === 0) return "All Roles";
    if (selectedRoles.length === 1) return selectedRoles[0];
    if (selectedRoles.length === 2)
      return `${selectedRoles[0]}, ${selectedRoles[1]}`;
    return `${selectedRoles.length} roles selected`;
  };

  // --- Availability Logic ---
  const changeMonth = (delta: number) => {
    setCurrentMonthDate(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1)
    );
  };

  const unavailableMembersOnSelectedDate = useMemo(() => {
    return members.filter((m) =>
      m.unavailableDates.some((d) => d.date === selectedDate)
    );
  }, [members, selectedDate]);

  const monthDays = useMemo(() => {
    const year = currentMonthDate.getFullYear();
    const month = currentMonthDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const startDay = new Date(year, month, 1).getDay();

    const days = [];
    for (let i = 0; i < startDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);
    return days;
  }, [currentMonthDate]);

  const getUnavailableCountForDate = (dateStr: string) => {
    return members.filter((m) =>
      m.unavailableDates.some((d) => d.date === dateStr)
    ).length;
  };

  const handleSaveUnavailability = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!unavailableModal.memberId) return;

    const member = members.find((m) => m.id === unavailableModal.memberId);
    if (!member) return;

    try {
      await api.updateMemberAvailability(
        member,
        selectedDate,
        unavailableModal.reason
      );
      showToast("Availability updated successfully", "success");
      setUnavailableModal((prev) => ({ ...prev, isOpen: false }));
    } catch (error) {
      showToast("Failed to update availability", "error");
    }
  };

  const handleRemoveUnavailability = async () => {
    if (!unavailableModal.memberId) return;
    const member = members.find((m) => m.id === unavailableModal.memberId);
    if (!member) return;

    try {
      await api.updateMemberAvailability(member, selectedDate); // undefined reason triggers remove
      showToast("Availability record removed", "info");
      setUnavailableModal((prev) => ({ ...prev, isOpen: false }));
    } catch (error) {
      showToast("Failed to remove availability", "error");
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col h-[calc(100vh-140px)]">
      {/* Header */}
      <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Team Management</h2>
          <p className="text-slate-500 text-sm">
            Manage roster and track availability.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-slate-100 p-1 rounded-lg flex items-center">
            <button
              onClick={() => setViewMode("roster")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                viewMode === "roster"
                  ? "bg-white text-black shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <LayoutList size={16} /> Roster
            </button>
            <button
              onClick={() => setViewMode("availability")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                viewMode === "availability"
                  ? "bg-white text-black shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <CalendarIcon size={16} /> Availability
            </button>
          </div>
          {!isReadOnly && (
            <button
              onClick={() => setIsInviteModalOpen(true)}
              className="flex items-center justify-center space-x-2 bg-black hover:bg-slate-800 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium shadow-sm"
            >
              <Plus size={16} />
              <span className="hidden sm:inline">Invite Member</span>
            </button>
          )}
        </div>
      </div>

      {viewMode === "roster" ? (
        <>
          {/* Roster Filters */}
          <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex flex-col md:flex-row gap-4 z-20 relative">
            <div className="relative flex-1">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                size={18}
              />
              <input
                type="text"
                placeholder="Search by name or email..."
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Multi-select Role Filter */}
            <div className="relative w-full md:w-72" ref={filterRef}>
              <button
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className={`w-full flex items-center justify-between pl-10 pr-4 py-2 rounded-lg border transition-all shadow-sm ${
                  selectedRoles.length > 0
                    ? "border-slate-400 bg-slate-100 ring-2 ring-slate-500/10"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <div className="flex items-center truncate mr-2">
                  <Filter
                    size={18}
                    className={`mr-2 flex-shrink-0 ${
                      selectedRoles.length > 0 ? "text-black" : "text-slate-400"
                    }`}
                  />
                  <span
                    className={`text-sm truncate ${
                      selectedRoles.length > 0
                        ? "text-black font-medium"
                        : "text-slate-500"
                    }`}
                  >
                    {getFilterLabel()}
                  </span>
                </div>
                <ChevronDown
                  size={16}
                  className={`text-slate-400 transition-transform flex-shrink-0 ${
                    isFilterOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {isFilterOpen && (
                <div className="absolute top-full right-0 left-0 mt-2 bg-white rounded-xl shadow-xl border border-slate-100 p-2 z-50 max-h-80 overflow-y-auto">
                  <div className="flex justify-between items-center px-2 py-2 mb-1 border-b border-slate-50 sticky top-0 bg-white z-10">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Filter by Role
                    </span>
                    {selectedRoles.length > 0 && (
                      <button
                        onClick={() => setSelectedRoles([])}
                        className="text-xs text-slate-600 hover:text-black font-medium px-2 py-1 rounded hover:bg-slate-50 transition-colors"
                      >
                        Clear All
                      </button>
                    )}
                  </div>
                  <div className="space-y-1 pt-1">
                    {Object.values(Role).map((role) => {
                      const isSelected = selectedRoles.includes(role);
                      const count = roleCounts[role] || 0;
                      return (
                        <div
                          key={role}
                          className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer text-sm transition-all ${
                            isSelected
                              ? "bg-slate-100 text-black font-medium"
                              : "text-slate-600 hover:bg-slate-50"
                          }`}
                          onClick={() => toggleRole(role)}
                        >
                          <div className="flex items-center">
                            <div
                              className={`w-4 h-4 rounded border flex items-center justify-center mr-3 transition-colors ${
                                isSelected
                                  ? "bg-black border-black"
                                  : "border-slate-300 bg-white"
                              }`}
                            >
                              {isSelected && (
                                <Check size={12} className="text-white" />
                              )}
                            </div>
                            <span>{role}</span>
                          </div>
                          {count > 0 && (
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full ${
                                isSelected
                                  ? "bg-slate-200 text-black"
                                  : "bg-slate-100 text-slate-500"
                              }`}
                            >
                              {count}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-auto z-0 relative">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 sticky top-0 z-10 shadow-sm">
                <tr>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                    Name
                  </th>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                    Roles
                  </th>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                    Status
                  </th>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200 text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredMembers.map((member) => {
                  // Filter future unavailability
                  const futureUnavailable = member.unavailableDates
                    .filter((d) => d.date >= todayStr)
                    .sort((a, b) => a.date.localeCompare(b.date));

                  const hasUnavailable = futureUnavailable.length > 0;

                  return (
                    <tr
                      key={member.id}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <img
                            className="h-10 w-10 rounded-full object-cover shadow-sm bg-slate-200"
                            src={member.avatar}
                            alt=""
                          />
                          <div className="ml-4">
                            <div className="text-sm font-medium text-slate-900 flex items-center gap-2">
                              {member.name}
                              {member.systemRole === "Admin" && (
                                <Shield size={12} className="text-slate-600" />
                              )}
                              {hasUnavailable && (
                                <div className="relative group/tooltip z-20">
                                  <CalendarOff
                                    size={14}
                                    className="text-amber-500 cursor-help"
                                  />
                                  <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 hidden group-hover/tooltip:block z-50 w-max pointer-events-none">
                                    <div className="bg-slate-800 text-white text-xs rounded p-2 shadow-lg min-w-[200px]">
                                      <span className="font-bold block mb-1 border-b border-slate-600 pb-1 text-slate-200">
                                        Unavailable Dates
                                      </span>
                                      <ul className="space-y-1">
                                        {futureUnavailable
                                          .slice(0, 5)
                                          .map((u) => (
                                            <li
                                              key={u.date}
                                              className="flex items-start gap-2"
                                            >
                                              <span className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-1.5 flex-shrink-0"></span>
                                              <span>
                                                <span className="font-mono text-slate-300">
                                                  {u.date}
                                                </span>
                                                {u.reason && (
                                                  <span className="block text-slate-400 italic text-[10px]">
                                                    {u.reason}
                                                  </span>
                                                )}
                                              </span>
                                            </li>
                                          ))}
                                      </ul>
                                      {futureUnavailable.length > 5 && (
                                        <p className="mt-1 text-[10px] text-slate-400 italic">
                                          +{futureUnavailable.length - 5} more
                                          dates
                                        </p>
                                      )}
                                    </div>
                                    <div className="absolute top-1/2 -left-1 -mt-1 w-2 h-2 bg-slate-800 rotate-45"></div>
                                  </div>
                                </div>
                              )}
                            </div>
                            <div className="text-sm text-slate-500">
                              {member.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1.5">
                          {member.roles.map((role) => (
                            <span
                              key={role}
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800 border border-slate-200"
                            >
                              {role}
                            </span>
                          ))}
                          {member.roles.length === 0 && (
                            <span className="text-xs text-slate-400 italic">
                              No roles assigned
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full border 
                            ${
                              member.status === "Active"
                                ? "bg-green-50 text-green-700 border-green-200"
                                : member.status === "Away"
                                ? "bg-amber-50 text-amber-700 border-amber-200"
                                : "bg-slate-100 text-slate-500 border-slate-200"
                            }`}
                        >
                          {member.status === "Inactive"
                            ? "Invited"
                            : member.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() =>
                              (window.location.href = `mailto:${member.email}`)
                            }
                            className="text-slate-400 hover:text-black p-2 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Email"
                          >
                            <Mail size={18} />
                          </button>
                          {!isReadOnly && (
                            <>
                              <button
                                onClick={() => setEditingMember(member)}
                                className="text-slate-400 hover:text-black p-2 hover:bg-slate-100 rounded-lg transition-colors"
                                title="Edit Member"
                              >
                                <Edit2 size={18} />
                              </button>
                              <button
                                onClick={() => setMemberToDelete(member)}
                                className="text-slate-400 hover:text-red-600 p-2 hover:bg-slate-100 rounded-lg transition-colors"
                                title="Remove Member"
                              >
                                <Trash2 size={18} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {filteredMembers.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-6 py-12 text-center text-slate-500"
                    >
                      {members.length === 0
                        ? "No team members found."
                        : "No team members match your filter."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        /* AVAILABILITY VIEW */
        <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
          {/* Calendar Side */}
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-lg text-slate-800">
                {currentMonthDate.toLocaleString("default", {
                  month: "long",
                  year: "numeric",
                })}
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={() => changeMonth(-1)}
                  className="p-2 hover:bg-slate-100 rounded-full text-slate-600"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  onClick={() => changeMonth(1)}
                  className="p-2 hover:bg-slate-100 rounded-full text-slate-600"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200">
              <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                  <div
                    key={d}
                    className="py-2 text-center text-xs font-semibold text-slate-500 uppercase"
                  >
                    {d}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 auto-rows-fr bg-slate-200 gap-px">
                {monthDays.map((day, i) => {
                  if (!day)
                    return (
                      <div
                        key={`blank-${i}`}
                        className="bg-slate-50 min-h-[80px]"
                      />
                    );

                  const year = currentMonthDate.getFullYear();
                  const month = (currentMonthDate.getMonth() + 1)
                    .toString()
                    .padStart(2, "0");
                  const dStr = day.toString().padStart(2, "0");
                  const dateStr = `${year}-${month}-${dStr}`;

                  const count = getUnavailableCountForDate(dateStr);
                  const isSelected = selectedDate === dateStr;

                  return (
                    <div
                      key={day}
                      onClick={() => setSelectedDate(dateStr)}
                      className={`bg-white min-h-[80px] p-2 relative cursor-pointer hover:bg-slate-50 transition-colors ${
                        isSelected
                          ? "ring-2 ring-inset ring-slate-500 z-10"
                          : ""
                      }`}
                    >
                      <span
                        className={`text-sm font-medium w-6 h-6 flex items-center justify-center rounded-full ${
                          isSelected ? "bg-black text-white" : "text-slate-700"
                        }`}
                      >
                        {day}
                      </span>
                      {count > 0 && (
                        <div className="mt-2 flex items-center gap-1 bg-red-50 text-red-600 px-2 py-1 rounded text-xs font-bold border border-red-100 w-fit">
                          <UserX size={12} />
                          <span>{count}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="mt-4 text-xs text-slate-500 flex items-center gap-2">
              <div className="w-3 h-3 bg-red-50 border border-red-100 rounded"></div>
              <span>Indicates number of unavailable members</span>
            </div>
          </div>

          {/* Details Side */}
          <div className="w-full lg:w-96 bg-slate-50 border-l border-slate-200 overflow-y-auto p-6">
            <div className="mb-6 flex justify-between items-start">
              <div>
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Selected Date
                </h3>
                <h2 className="text-2xl font-bold text-slate-800">
                  {new Date(selectedDate).toLocaleDateString(undefined, {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                  })}
                </h2>
              </div>
              {!isReadOnly && (
                <button
                  onClick={() =>
                    setUnavailableModal({
                      isOpen: true,
                      memberId: "",
                      reason: "",
                      mode: "add",
                    })
                  }
                  className="p-2 bg-black text-white rounded-lg hover:bg-slate-800 transition-colors"
                  title="Mark Someone Unavailable"
                >
                  <Plus size={18} />
                </button>
              )}
            </div>

            <div className="space-y-4">
              <h3 className="font-bold text-slate-700 flex items-center gap-2">
                <UserX size={18} className="text-red-500" />
                Unavailable Members ({unavailableMembersOnSelectedDate.length})
              </h3>

              {unavailableMembersOnSelectedDate.length > 0 ? (
                <div className="space-y-3">
                  {unavailableMembersOnSelectedDate.map((member) => {
                    // Find specific reason for this selected date
                    const currentUnavailability = member.unavailableDates.find(
                      (d) => d.date === selectedDate
                    );
                    return (
                      <div
                        key={member.id}
                        className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative group"
                      >
                        {!isReadOnly && (
                          <button
                            onClick={() =>
                              setUnavailableModal({
                                isOpen: true,
                                memberId: member.id,
                                reason: currentUnavailability?.reason || "",
                                mode: "edit",
                              })
                            }
                            className="absolute top-3 right-3 p-1.5 text-slate-400 hover:text-black hover:bg-slate-100 rounded opacity-0 group-hover:opacity-100 transition-all"
                            title="Edit unavailability note"
                          >
                            <Edit2 size={14} />
                          </button>
                        )}

                        <div className="flex items-center gap-3 mb-2">
                          <img
                            src={member.avatar}
                            alt={member.name}
                            className="w-10 h-10 rounded-full bg-slate-200"
                          />
                          <div>
                            <p className="font-bold text-slate-800">
                              {member.name}
                            </p>
                            <div className="flex flex-wrap gap-1 mt-0.5">
                              {member.roles.slice(0, 2).map((r) => (
                                <span
                                  key={r}
                                  className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded"
                                >
                                  {r}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>

                        {currentUnavailability?.reason ? (
                          <div className="mb-3 bg-red-50 text-red-800 text-xs px-2 py-1.5 rounded border border-red-100">
                            <span className="font-bold">Note:</span>{" "}
                            {currentUnavailability.reason}
                          </div>
                        ) : (
                          <div className="mb-3 text-slate-400 text-xs italic pl-1">
                            No reason provided.
                          </div>
                        )}

                        {/* Sub-list of dates for this specific item (person) */}
                        <div className="border-t border-slate-100 pt-3">
                          <p className="text-xs font-semibold text-slate-500 mb-2">
                            Upcoming Unavailable Dates:
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {member.unavailableDates
                              .filter((d) => d.date >= todayStr)
                              .sort((a, b) => a.date.localeCompare(b.date))
                              .map((u) => (
                                <span
                                  key={u.date}
                                  title={u.reason}
                                  className={`text-[10px] px-2 py-0.5 rounded border cursor-help ${
                                    u.date === selectedDate
                                      ? "bg-red-100 text-red-700 border-red-200 font-bold"
                                      : "bg-slate-100 text-slate-600 border-slate-200"
                                  }`}
                                >
                                  {u.date}
                                </span>
                              ))}
                            {member.unavailableDates.filter(
                              (d) => d.date >= todayStr
                            ).length === 0 && (
                              <span className="text-[10px] text-slate-400 italic">
                                No future dates recorded
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-8 border-2 border-dashed border-slate-200 rounded-xl text-center">
                  <Check className="mx-auto text-emerald-500 mb-2" size={24} />
                  <p className="text-slate-600 font-medium">
                    Everyone is available!
                  </p>
                  <p className="text-slate-400 text-sm mt-1">
                    No unavailability recorded for this date.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Invite Member Modal */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-xl sticky top-0">
              <h3 className="font-bold text-slate-800">Invite New Member</h3>
              <button onClick={() => setIsInviteModalOpen(false)}>
                <X size={20} className="text-slate-400" />
              </button>
            </div>
            <form onSubmit={handleInviteSubmit} className="p-6 space-y-4">
              <p className="text-sm text-slate-600">
                Add a team member to the roster and send them an email
                invitation.
              </p>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-slate-500"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  placeholder="Jane Doe"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-slate-500"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="jane@church.org"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Assign Roles
                </label>
                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 border rounded-lg bg-slate-50">
                  {Object.values(Role).map((role) => {
                    const isSelected = inviteRoles.includes(role);
                    return (
                      <div
                        key={role}
                        onClick={() => handleInviteRoleToggle(role)}
                        className={`flex items-center gap-2 p-2 bg-white rounded border cursor-pointer hover:border-slate-300 ${
                          isSelected
                            ? "border-slate-500 ring-1 ring-slate-500"
                            : "border-slate-200"
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded border flex items-center justify-center ${
                            isSelected
                              ? "bg-black border-black"
                              : "border-slate-300"
                          }`}
                        >
                          {isSelected && (
                            <Check size={10} className="text-white" />
                          )}
                        </div>
                        <span className="text-xs text-slate-700">{role}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={copyInviteLink}
                  className="flex-1 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 flex items-center justify-center gap-2 text-sm"
                >
                  <Copy size={16} /> Copy Link
                </button>
                <button
                  type="submit"
                  disabled={isInviting}
                  className="flex-[2] py-2 bg-black text-white rounded-lg hover:bg-slate-800 flex items-center justify-center gap-2 text-sm disabled:bg-slate-400"
                >
                  {isInviting ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Send size={16} />
                  )}
                  Send Invite
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Member Modal */}
      {editingMember && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-xl">
              <h3 className="font-bold text-slate-800">Edit Member</h3>
              <button onClick={() => setEditingMember(null)}>
                <X size={20} className="text-slate-400" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="flex items-center gap-4">
                <img
                  src={editingMember.avatar}
                  className="w-16 h-16 rounded-full bg-slate-200"
                />
                <div>
                  <h4 className="font-bold text-lg">{editingMember.name}</h4>
                  <p className="text-slate-500 text-sm">
                    {editingMember.email}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  System Permission
                </label>
                <select
                  className="w-full border rounded-lg px-3 py-2"
                  value={editingMember.systemRole}
                  onChange={(e) =>
                    setEditingMember({
                      ...editingMember,
                      systemRole: e.target.value as SystemRole,
                    })
                  }
                >
                  <option value="Member">Member (Read only)</option>
                  <option value="Admin">Admin (Full Access)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Band Roles
                </label>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 border rounded-lg bg-slate-50">
                  {Object.values(Role).map((role) => (
                    <label
                      key={role}
                      className="flex items-center gap-2 p-2 bg-white rounded border border-slate-200 cursor-pointer hover:border-slate-300"
                    >
                      <input
                        type="checkbox"
                        checked={editingMember.roles.includes(role)}
                        onChange={() => handleEditRoleToggle(role)}
                        className="rounded text-slate-600 focus:ring-slate-500"
                      />
                      <span className="text-sm text-slate-700">{role}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button
                  onClick={() => setEditingMember(null)}
                  className="flex-1 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveMember}
                  className="flex-1 py-2 bg-black text-white rounded-lg hover:bg-slate-800 flex justify-center items-center gap-2"
                >
                  <Save size={18} /> Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Member Modal */}
      {memberToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden">
            <div className="p-6 text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="text-red-600" size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">
                Remove Member?
              </h3>
              <p className="text-slate-500 text-sm mb-6">
                Are you sure you want to remove{" "}
                <strong>{memberToDelete.name}</strong> from the team? This
                action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setMemberToDelete(null)}
                  className="flex-1 py-2.5 border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteMember}
                  className="flex-1 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors shadow-sm"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Unavailability Management Modal */}
      {unavailableModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm animate-in fade-in zoom-in duration-200">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-slate-800">
                  {unavailableModal.mode === "add"
                    ? "Mark Unavailable"
                    : "Edit Unavailable Note"}
                </h3>
                <button
                  onClick={() =>
                    setUnavailableModal((prev) => ({ ...prev, isOpen: false }))
                  }
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSaveUnavailability}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Date
                    </label>
                    <div className="px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-600 text-sm font-medium">
                      {new Date(selectedDate).toLocaleDateString(undefined, {
                        weekday: "long",
                        month: "long",
                        day: "numeric",
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Member
                    </label>
                    {unavailableModal.mode === "edit" ? (
                      <div className="px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-600 text-sm font-medium flex items-center gap-2">
                        <User size={16} />
                        {members.find((m) => m.id === unavailableModal.memberId)
                          ?.name || "Unknown Member"}
                      </div>
                    ) : (
                      <select
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 text-sm"
                        required
                        value={unavailableModal.memberId}
                        onChange={(e) =>
                          setUnavailableModal({
                            ...unavailableModal,
                            memberId: e.target.value,
                          })
                        }
                      >
                        <option value="">-- Select Member --</option>
                        {members
                          .filter(
                            (m) =>
                              !m.unavailableDates.some(
                                (d) => d.date === selectedDate
                              )
                          )
                          .sort((a, b) => a.name.localeCompare(b.name))
                          .map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.name}
                            </option>
                          ))}
                      </select>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Reason (Optional)
                    </label>
                    <input
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 text-sm"
                      placeholder="e.g. Vacation, Work, Sick..."
                      value={unavailableModal.reason}
                      onChange={(e) =>
                        setUnavailableModal({
                          ...unavailableModal,
                          reason: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  {unavailableModal.mode === "edit" && (
                    <button
                      type="button"
                      onClick={handleRemoveUnavailability}
                      className="flex-1 py-2 bg-red-50 text-red-600 border border-red-100 rounded-lg hover:bg-red-100 font-medium flex items-center justify-center gap-2 text-sm"
                    >
                      <Trash2 size={16} /> Remove
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={!unavailableModal.memberId}
                    className={`flex-[2] py-2 bg-black text-white rounded-lg hover:bg-slate-800 font-medium flex items-center justify-center gap-2 text-sm disabled:bg-slate-400 ${
                      unavailableModal.mode === "add" ? "w-full" : ""
                    }`}
                  >
                    <Save size={16} /> Save
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

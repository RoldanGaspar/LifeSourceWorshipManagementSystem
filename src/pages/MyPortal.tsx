import React, { useState } from "react";
import { Member, ServicePlan, AssignmentStatus } from "../types/types";
import {
  CheckCircle2,
  XCircle,
  Clock,
  Calendar as CalendarIcon,
  MapPin,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  X,
  Save,
  Trash2,
} from "lucide-react";

interface MyPortalProps {
  currentUser: Member;
  services: ServicePlan[];
  onUpdateStatus: (serviceId: string, status: AssignmentStatus) => void;
  onUpdateAvailability: (date: string, reason?: string) => void;
}

export const MyPortal: React.FC<MyPortalProps> = ({
  currentUser,
  services,
  onUpdateStatus,
  onUpdateAvailability,
}) => {
  // Simple calendar state initialized to current month
  const [currentMonthDate, setCurrentMonthDate] = useState(new Date());

  // Unavailability Reason Modal State
  const [unavailableModalDate, setUnavailableModalDate] = useState<
    string | null
  >(null);
  const [unavailableReason, setUnavailableReason] = useState("");
  const [isEditingExisting, setIsEditingExisting] = useState(false);

  // Get user's assignments
  const myAssignments = services.flatMap((service) =>
    service.team
      .filter((t) => t.memberId === currentUser.id)
      .map((t) => ({ ...t, service }))
  );

  const pendingAssignments = myAssignments.filter(
    (a) => a.status === "Pending"
  );
  const confirmedAssignments = myAssignments.filter(
    (a) => a.status === "Confirmed"
  );

  // Calendar Logic
  const daysInMonth = new Date(
    currentMonthDate.getFullYear(),
    currentMonthDate.getMonth() + 1,
    0
  ).getDate();
  const startDay = new Date(
    currentMonthDate.getFullYear(),
    currentMonthDate.getMonth(),
    1
  ).getDay();
  const monthName = currentMonthDate.toLocaleString("default", {
    month: "long",
    year: "numeric",
  });

  const changeMonth = (delta: number) => {
    setCurrentMonthDate(
      new Date(
        currentMonthDate.getFullYear(),
        currentMonthDate.getMonth() + delta,
        1
      )
    );
  };

  const isDateUnavailable = (dateStr: string) =>
    currentUser.unavailableDates.some((d) => d.date === dateStr);
  const getUnavailability = (dateStr: string) =>
    currentUser.unavailableDates.find((d) => d.date === dateStr);
  const getDayAssignments = (dateStr: string) =>
    myAssignments.filter((a) => a.service.date === dateStr);

  const handleDateClick = (dateStr: string) => {
    const existing = getUnavailability(dateStr);

    if (existing) {
      // Edit mode
      setUnavailableModalDate(dateStr);
      setUnavailableReason(existing.reason || "");
      setIsEditingExisting(true);
    } else {
      // Create mode
      setUnavailableModalDate(dateStr);
      setUnavailableReason("");
      setIsEditingExisting(false);
    }
  };

  const saveUnavailable = () => {
    if (unavailableModalDate) {
      onUpdateAvailability(unavailableModalDate, unavailableReason);
      setUnavailableModalDate(null);
      setUnavailableReason("");
      setIsEditingExisting(false);
    }
  };

  const removeUnavailable = () => {
    if (unavailableModalDate) {
      onUpdateAvailability(unavailableModalDate); // passing undefined reason triggers remove in api logic
      setUnavailableModalDate(null);
      setUnavailableReason("");
      setIsEditingExisting(false);
    }
  };

  return (
    <div className="space-y-6 relative">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">My Portal</h1>
          <p className="text-slate-500">
            Welcome back, {currentUser.name}. Manage your schedule and
            availability.
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-lg text-slate-900 font-medium">
          <Clock size={18} />
          <span className="text-sm">
            Next:{" "}
            {confirmedAssignments[0]?.service.date || "No upcoming services"}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Actions & Schedule */}
        <div className="lg:col-span-2 space-y-6">
          {/* Pending Requests */}
          {pendingAssignments.length > 0 && (
            <div className="bg-amber-50 rounded-xl border border-amber-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-amber-100 flex items-center gap-2">
                <AlertCircle className="text-amber-600" size={20} />
                <h3 className="font-bold text-amber-800">
                  Action Required ({pendingAssignments.length})
                </h3>
              </div>
              <div className="divide-y divide-amber-100">
                {pendingAssignments.map((assignment, idx) => (
                  <div
                    key={idx}
                    className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div>
                      <h4 className="font-bold text-slate-800 text-lg">
                        {assignment.service.title}
                      </h4>
                      <div className="flex items-center gap-4 mt-1 text-sm text-slate-600">
                        <span className="flex items-center gap-1">
                          <CalendarIcon size={14} /> {assignment.service.date}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={14} /> {assignment.service.time}
                        </span>
                      </div>
                      <div className="mt-2 inline-block px-2 py-0.5 rounded text-xs font-semibold bg-white border border-amber-200 text-amber-700 uppercase tracking-wide">
                        Requested as: {assignment.role}
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() =>
                          onUpdateStatus(assignment.service.id, "Declined")
                        }
                        className="flex-1 md:flex-none px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 hover:text-red-600 transition-colors font-medium flex items-center justify-center gap-2"
                      >
                        <XCircle size={16} /> Decline
                      </button>
                      <button
                        onClick={() =>
                          onUpdateStatus(assignment.service.id, "Confirmed")
                        }
                        className="flex-1 md:flex-none px-6 py-2 bg-black text-white rounded-lg hover:bg-slate-800 transition-colors font-medium flex items-center justify-center gap-2 shadow-sm"
                      >
                        <CheckCircle2 size={16} /> Accept
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upcoming Schedule */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-800">Upcoming Schedule</h3>
            </div>
            {confirmedAssignments.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {confirmedAssignments.map((assignment, idx) => (
                  <div
                    key={idx}
                    className="p-6 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                      <div className="flex gap-4">
                        <div className="flex flex-col items-center bg-slate-100 text-slate-900 rounded-lg p-3 w-16 h-16 justify-center">
                          <span className="text-xs font-bold uppercase">
                            {new Date(assignment.service.date).toLocaleString(
                              "default",
                              { month: "short" }
                            )}
                          </span>
                          <span className="text-xl font-bold">
                            {new Date(assignment.service.date).getDate()}
                          </span>
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-800">
                            {assignment.service.title}
                          </h4>
                          <p className="text-sm text-slate-500 mb-2">
                            {assignment.role}
                          </p>
                          <div className="flex items-center gap-3 text-xs text-slate-500">
                            <span className="flex items-center gap-1">
                              <Clock size={12} /> Service:{" "}
                              {assignment.service.time}
                            </span>
                            {assignment.service.rehearsal && (
                              <span className="flex items-center gap-1 text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">
                                <Clock size={12} /> Rehearsal:{" "}
                                {assignment.service.rehearsal.date ===
                                assignment.service.date
                                  ? "Same Day"
                                  : assignment.service.rehearsal.date}{" "}
                                @ {assignment.service.rehearsal.time}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 flex items-center gap-1">
                          <CheckCircle2 size={12} /> Confirmed
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-slate-500">
                No upcoming confirmed services.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Availability Manager */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col h-fit">
          <div className="p-6 border-b border-slate-100">
            <h3 className="font-bold text-slate-800">Availability Manager</h3>
            <p className="text-xs text-slate-500 mt-1">
              Tap dates to mark as unavailable or edit notes.
            </p>
          </div>

          <div className="p-4">
            <div className="flex justify-between items-center mb-4">
              <button
                onClick={() => changeMonth(-1)}
                className="p-1 hover:bg-slate-100 rounded"
              >
                <ChevronLeft size={18} className="text-slate-500" />
              </button>
              <span className="font-semibold text-slate-700 text-sm">
                {monthName}
              </span>
              <button
                onClick={() => changeMonth(1)}
                className="p-1 hover:bg-slate-100 rounded"
              >
                <ChevronRight size={18} className="text-slate-500" />
              </button>
            </div>

            <div className="grid grid-cols-7 text-center mb-2">
              {["S", "M", "T", "W", "T", "F", "S"].map((d) => (
                <div key={d} className="text-[10px] font-bold text-slate-400">
                  {d}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: startDay }).map((_, i) => (
                <div key={`empty-${i}`} />
              ))}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                // Build Date String YYYY-MM-DD
                const year = currentMonthDate.getFullYear();
                const month = (currentMonthDate.getMonth() + 1)
                  .toString()
                  .padStart(2, "0");
                const d = day.toString().padStart(2, "0");
                const dateStr = `${year}-${month}-${d}`;

                const unavailable = getUnavailability(dateStr);
                const hasService = getDayAssignments(dateStr).length > 0;

                return (
                  <button
                    key={day}
                    onClick={() => handleDateClick(dateStr)}
                    disabled={hasService}
                    title={
                      unavailable?.reason
                        ? `Unavailable: ${unavailable.reason}`
                        : undefined
                    }
                    className={`
                                    h-9 w-9 rounded-full flex items-center justify-center text-sm font-medium transition-all relative
                                    ${
                                      unavailable
                                        ? "bg-red-100 text-red-600 hover:bg-red-200 ring-1 ring-transparent hover:ring-red-300"
                                        : hasService
                                        ? "bg-black text-white cursor-default"
                                        : "hover:bg-slate-100 text-slate-700"
                                    }
                                `}
                  >
                    {day}
                    {unavailable && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-full h-0.5 bg-red-400 rotate-45 transform scale-75"></div>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="p-4 border-t border-slate-100 bg-slate-50 rounded-b-xl text-xs text-slate-500 space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-100 border border-red-200 relative">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-full h-px bg-red-400 rotate-45 transform scale-75"></div>
                </div>
              </div>
              <span>Unavailable (Click to edit)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-black"></div>
              <span>Scheduled Service</span>
            </div>
          </div>
        </div>
      </div>

      {/* Unavailability Reason Modal */}
      {unavailableModalDate && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-slate-800">
                  {isEditingExisting
                    ? "Edit Unavailability"
                    : "Mark as Unavailable"}
                </h3>
                <button
                  onClick={() => setUnavailableModalDate(null)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X size={20} />
                </button>
              </div>
              <p className="text-sm text-slate-600 mb-4">
                {new Date(unavailableModalDate).toLocaleDateString(undefined, {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })}
              </p>
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Reason (Optional)
                </label>
                <input
                  autoFocus
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
                  placeholder="e.g. Vacation, Sick, Work..."
                  value={unavailableReason}
                  onChange={(e) => setUnavailableReason(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && saveUnavailable()}
                />
              </div>
              <div className="flex gap-3">
                {isEditingExisting && (
                  <button
                    onClick={removeUnavailable}
                    className="flex-1 py-2 bg-red-50 text-red-600 border border-red-100 rounded-lg hover:bg-red-100 font-medium flex items-center justify-center gap-2"
                  >
                    <Trash2 size={16} /> Remove
                  </button>
                )}
                <button
                  onClick={saveUnavailable}
                  className={`flex-[2] py-2 bg-black text-white rounded-lg hover:bg-slate-800 font-medium flex items-center justify-center gap-2 ${
                    !isEditingExisting ? "w-full" : ""
                  }`}
                >
                  <Save size={16} /> {isEditingExisting ? "Update" : "Save"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

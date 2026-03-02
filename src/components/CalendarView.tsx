import React, { useState } from "react";
import { ServicePlan } from "../types/types";
import { ChevronLeft, ChevronRight, Clock } from "lucide-react";

interface CalendarViewProps {
  services: ServicePlan[];
  onSelectService: (serviceId: string) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  services,
  onSelectService,
}) => {
  const [currentMonthDate, setCurrentMonthDate] = useState(new Date());

  const daysInMonth = new Date(
    currentMonthDate.getFullYear(),
    currentMonthDate.getMonth() + 1,
    0
  ).getDate();
  const startDayOfWeek = new Date(
    currentMonthDate.getFullYear(),
    currentMonthDate.getMonth(),
    1
  ).getDay();

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blanks = Array.from({ length: startDayOfWeek }, (_, i) => i);

  const getServicesForDay = (day: number) => {
    // Format: YYYY-MM-DD using local time parts to avoid timezone shifts
    const year = currentMonthDate.getFullYear();
    const month = (currentMonthDate.getMonth() + 1).toString().padStart(2, "0");
    const d = day.toString().padStart(2, "0");
    const dateStr = `${year}-${month}-${d}`;

    return services.filter((s) => s.date === dateStr);
  };

  const changeMonth = (delta: number) => {
    setCurrentMonthDate(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1)
    );
  };

  const monthName = currentMonthDate.toLocaleString("default", {
    month: "long",
    year: "numeric",
  });
  const today = new Date();
  const isCurrentMonth =
    today.getMonth() === currentMonthDate.getMonth() &&
    today.getFullYear() === currentMonthDate.getFullYear();

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col h-full overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
        <h2 className="text-xl font-bold text-slate-800">{monthName}</h2>
        <div className="flex gap-2">
          <button
            onClick={() => changeMonth(-1)}
            className="p-2 hover:bg-slate-200 rounded-full text-slate-500"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={() => changeMonth(1)}
            className="p-2 hover:bg-slate-200 rounded-full text-slate-500"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div
            key={d}
            className="py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider"
          >
            {d}
          </div>
        ))}
      </div>

      <div className="flex-1 grid grid-cols-7 auto-rows-fr bg-slate-200 gap-px overflow-y-auto">
        {blanks.map((i) => (
          <div key={`blank-${i}`} className="bg-slate-50 min-h-[120px]" />
        ))}

        {days.map((day) => {
          const dayServices = getServicesForDay(day);
          const isToday = isCurrentMonth && day === today.getDate();

          return (
            <div
              key={day}
              className={`bg-white min-h-[120px] p-2 relative group hover:bg-slate-50 transition-colors ${
                isToday ? "bg-slate-100" : ""
              }`}
            >
              <span
                className={`text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full mb-2 
                ${isToday ? "bg-black text-white" : "text-slate-700"}`}
              >
                {day}
              </span>

              <div className="space-y-1">
                {dayServices.map((svc) => (
                  <button
                    key={svc.id}
                    onClick={() => onSelectService(svc.id)}
                    className="w-full text-left bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded px-2 py-1.5 transition-colors group-service"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-slate-900 truncate">
                        {svc.time} Service
                      </p>
                    </div>
                    <p className="text-[10px] text-slate-600 truncate">
                      {svc.title}
                    </p>
                    {svc.rehearsal && (
                      <div className="mt-1 flex items-center text-[9px] text-slate-500 gap-1">
                        <Clock size={8} />
                        <span>Rehearsal {svc.rehearsal.time}</span>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

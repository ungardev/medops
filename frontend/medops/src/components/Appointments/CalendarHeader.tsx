// src/components/Appointments/CalendarHeader.tsx
import moment from "moment";
import { 
  ChevronLeftIcon, 
  ChevronRightIcon, 
  ArrowPathIcon 
} from "@heroicons/react/24/outline";

interface Props {
  currentMonth: moment.Moment;
  onChangeMonth: (newMonth: moment.Moment) => void;
}

export default function CalendarHeader({ currentMonth, onChangeMonth }: Props) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4">
      {/* 🛰️ Temporal Focus Display */}
      <div className="flex flex-col">
        <span className="text-[9px] font-black text-[var(--palantir-active)] uppercase tracking-[0.3em] mb-1">
          Temporal_Range_Active
        </span>
        <h3 className="text-xl font-black text-[var(--palantir-text)] uppercase tracking-tight">
          {currentMonth.format("MMMM")} <span className="text-[var(--palantir-muted)] font-mono">{currentMonth.format("YYYY")}</span>
        </h3>
      </div>

      {/* 🕹️ Navigation Controls */}
      <div className="flex items-center gap-1 bg-black/20 p-1 border border-[var(--palantir-border)] rounded-sm">
        <button
          title="Previous Cycle"
          onClick={() => onChangeMonth(currentMonth.clone().subtract(1, "month"))}
          className="p-2 hover:bg-[var(--palantir-active)]/10 text-[var(--palantir-muted)] hover:text-[var(--palantir-active)] transition-all"
        >
          <ChevronLeftIcon className="w-4 h-4" />
        </button>

        <button
          title="Sync to Present"
          onClick={() => onChangeMonth(moment())}
          className="px-4 py-1.5 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[var(--palantir-active)] hover:bg-[var(--palantir-active)]/10 transition-all border-x border-[var(--palantir-border)]"
        >
          <ArrowPathIcon className="w-3 h-3" />
          Present
        </button>

        <button
          title="Next Cycle"
          onClick={() => onChangeMonth(currentMonth.clone().add(1, "month"))}
          className="p-2 hover:bg-[var(--palantir-active)]/10 text-[var(--palantir-muted)] hover:text-[var(--palantir-active)] transition-all"
        >
          <ChevronRightIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

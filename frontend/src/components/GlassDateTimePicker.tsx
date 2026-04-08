import { useState, useRef, useEffect } from "react";

export interface GlassDateTimePickerProps {
  value: string; // "YYYY-MM-DD" or "YYYY-MM-DDTHH:mm"
  onChange: (value: string) => void;
  id?: string;
  required?: boolean;
  /** Show the time picker columns. Default true. */
  showTime?: boolean;
  /** Use rounded-full trigger (pill shape). Default false = rounded-xl. */
  pill?: boolean;
}

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];
const DAY_HDRS = ["S","M","T","W","T","F","S"];

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function toInputValue(d: Date, showTime: boolean): string {
  const datePart = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  return showTime ? `${datePart}T${pad(d.getHours())}:${pad(d.getMinutes())}` : datePart;
}

function parseValue(v: string): Date | null {
  if (!v) return null;
  const d = new Date(v.includes("T") ? v : `${v}T00:00`);
  return isNaN(d.getTime()) ? null : d;
}

function formatDisplay(d: Date | null, showTime: boolean): string {
  if (!d) return showTime ? "mm/dd/yyyy, --:-- --" : "mm/dd/yyyy";
  return d.toLocaleString("en-US", {
    month: "numeric",
    day: "numeric",
    year: "numeric",
    ...(showTime ? { hour: "numeric", minute: "2-digit", hour12: true } : {}),
  });
}

function display12(h: number): number {
  return h % 12 === 0 ? 12 : h % 12;
}

export default function GlassDateTimePicker({
  value,
  onChange,
  id,
  required,
  showTime = true,
  pill = false,
}: GlassDateTimePickerProps) {
  const selected = parseValue(value);
  const [open, setOpen] = useState(false);
  const [viewDate, setViewDate] = useState<Date>(() => selected ?? new Date());
  const wrapRef = useRef<HTMLDivElement>(null);
  const hourRef = useRef<HTMLDivElement>(null);
  const minRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Scroll hour/min columns into view after popup renders
  useEffect(() => {
    if (!open || !showTime) return;
    const timer = setTimeout(() => {
      if (hourRef.current && selected) {
        const idx = display12(selected.getHours()) - 1;
        (hourRef.current.children[idx] as HTMLElement)?.scrollIntoView({ block: "center", behavior: "instant" });
      }
      if (minRef.current && selected) {
        (minRef.current.children[selected.getMinutes()] as HTMLElement)?.scrollIntoView({ block: "center", behavior: "instant" });
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [open]);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();
  const dispH = selected ? display12(selected.getHours()) : 8;
  const dispM = selected?.getMinutes() ?? 0;
  const isPM = (selected?.getHours() ?? 0) >= 12;

  function openPicker() {
    if (!open && selected) setViewDate(selected);
    setOpen((o) => !o);
  }

  function selectDay(day: number) {
    const h = selected?.getHours() ?? 0;
    const m = selected?.getMinutes() ?? 0;
    const next = new Date(year, month, day, h, m);
    onChange(toInputValue(next, showTime));
    if (!showTime) setOpen(false);
  }

  function setHourDisplay(displayH: number) {
    const base = selected ?? new Date(year, month, 1, 8, 0);
    const h24 =
      displayH === 12
        ? isPM ? 12 : 0
        : isPM ? displayH + 12 : displayH;
    onChange(toInputValue(
      new Date(base.getFullYear(), base.getMonth(), base.getDate(), h24, base.getMinutes()),
      showTime,
    ));
  }

  function setMinuteVal(m: number) {
    const base = selected ?? new Date(year, month, 1, 8, 0);
    onChange(toInputValue(
      new Date(base.getFullYear(), base.getMonth(), base.getDate(), base.getHours(), m),
      showTime,
    ));
  }

  function togglePeriod(period: "AM" | "PM") {
    if (!selected) return;
    const h = selected.getHours();
    const h24 =
      period === "AM"
        ? h >= 12 ? h - 12 : h
        : h < 12 ? h + 12 : h;
    onChange(toInputValue(
      new Date(selected.getFullYear(), selected.getMonth(), selected.getDate(), h24, selected.getMinutes()),
      showTime,
    ));
  }

  const radius = pill ? "rounded-full" : "rounded-xl";

  return (
    <div ref={wrapRef} className="relative">
      {/* Hidden input for native form required validation */}
      {required && (
        <input
          type="text"
          value={value}
          required
          readOnly
          tabIndex={-1}
          aria-hidden="true"
          className="sr-only"
        />
      )}

      {/* Trigger */}
      <button
        type="button"
        id={id}
        onClick={openPicker}
        className={`w-full input-glass ${radius} px-4 py-2.5 text-sm text-left flex items-center justify-between gap-2 cursor-pointer`}
      >
        <span className={selected ? "text-slate-800" : "text-slate-400"}>
          {formatDisplay(selected, showTime)}
        </span>
        <svg
          className="w-4 h-4 text-slate-400 shrink-0"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </button>

      {/* Popup */}
      {open && (
        <div className="absolute top-full left-0 mt-2 z-60 input-glass rounded-2xl shadow-2xl p-4 flex gap-4">
          {/* ── Calendar ── */}
          <div className="select-none">
            {/* Month nav */}
            <div className="flex items-center justify-between mb-3">
              <button
                type="button"
                onClick={() => setViewDate(new Date(year, month - 1, 1))}
                className="w-7 h-7 rounded-lg hover:bg-black/8 transition-colors flex items-center justify-center cursor-pointer"
              >
                <svg className="w-3.5 h-3.5 text-slate-600" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <span className="text-sm font-semibold text-slate-800 min-w-[140px] text-center">
                {MONTHS[month]} {year}
              </span>
              <button
                type="button"
                onClick={() => setViewDate(new Date(year, month + 1, 1))}
                className="w-7 h-7 rounded-lg hover:bg-black/8 transition-colors flex items-center justify-center cursor-pointer"
              >
                <svg className="w-3.5 h-3.5 text-slate-600" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 gap-0.5 mb-1">
              {DAY_HDRS.map((d, i) => (
                <div key={i} className="w-8 h-7 flex items-center justify-center text-xs font-medium text-slate-400">
                  {d}
                </div>
              ))}
            </div>

            {/* Day grid */}
            <div className="grid grid-cols-7 gap-0.5">
              {Array.from({ length: firstDay }, (_, i) => (
                <div key={`blank-${i}`} className="w-8 h-8" />
              ))}
              {Array.from({ length: daysInMonth }, (_, i) => {
                const day = i + 1;
                const isSel =
                  selected?.getDate() === day &&
                  selected?.getMonth() === month &&
                  selected?.getFullYear() === year;
                const isTod =
                  today.getDate() === day &&
                  today.getMonth() === month &&
                  today.getFullYear() === year;
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => selectDay(day)}
                    className={`w-8 h-8 rounded-full text-xs font-medium transition-all cursor-pointer ${
                      isSel
                        ? "bg-[#1a4f3b] text-white shadow-sm"
                        : isTod
                        ? "border border-[#1a4f3b]/50 text-[#1a4f3b] font-semibold"
                        : "text-slate-700 hover:bg-black/8"
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>

            {/* Clear / Today */}
            <div className="flex justify-between mt-3 pt-3 border-t border-slate-200/60">
              <button
                type="button"
                onClick={() => { onChange(""); setOpen(false); }}
                className="text-xs text-slate-500 hover:text-slate-700 transition-colors cursor-pointer"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => {
                  const n = new Date();
                  setViewDate(n);
                  onChange(toInputValue(n, showTime));
                  if (!showTime) setOpen(false);
                }}
                className="text-xs text-[#1a4f3b] font-semibold hover:text-[#2f6d56] transition-colors cursor-pointer"
              >
                Today
              </button>
            </div>
          </div>

          {/* ── Time picker ── */}
          {showTime && (
            <div className="border-l border-slate-200/60 pl-4 select-none">
              <div className="text-xs font-medium text-slate-500 mb-2 text-center">Time</div>
              <div className="flex gap-1 items-start">
                {/* Hours 1-12 */}
                <div
                  ref={hourRef}
                  className="overflow-y-auto h-44 w-9 space-y-0.5 scrollbar-hide"
                  style={{ scrollbarWidth: "none" }}
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => (
                    <button
                      key={h}
                      type="button"
                      onClick={() => setHourDisplay(h)}
                      className={`w-full h-8 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                        dispH === h
                          ? "bg-[#1a4f3b] text-white"
                          : "text-slate-600 hover:bg-black/8"
                      }`}
                    >
                      {pad(h)}
                    </button>
                  ))}
                </div>

                <div className="text-slate-400 text-sm font-bold self-center px-0.5">:</div>

                {/* Minutes 00-59 */}
                <div
                  ref={minRef}
                  className="overflow-y-auto h-44 w-9 space-y-0.5 scrollbar-hide"
                  style={{ scrollbarWidth: "none" }}
                >
                  {Array.from({ length: 60 }, (_, i) => i).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMinuteVal(m)}
                      className={`w-full h-8 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                        dispM === m
                          ? "bg-[#1a4f3b] text-white"
                          : "text-slate-600 hover:bg-black/8"
                      }`}
                    >
                      {pad(m)}
                    </button>
                  ))}
                </div>

                {/* AM / PM */}
                <div className="flex flex-col gap-1.5 ml-1 self-center">
                  {(["AM", "PM"] as const).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => togglePeriod(p)}
                      className={`px-2 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                        (p === "AM" && !isPM) || (p === "PM" && isPM)
                          ? "bg-[#1a4f3b] text-white"
                          : "text-slate-600 hover:bg-black/8"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

import { useState, useEffect, useMemo } from "react";
import type { Attendee } from "../../lib/api";

interface Props {
  attendees: Attendee[] | undefined;
  eventTitle: string;
  checkingInTicketId: number | null;
  onCheckin: (ticketId: number, eventId: number) => void;
  eventId: number;
  onClose: () => void;
}

export default function AttendeesPanel({
  attendees,
  eventTitle,
  checkingInTicketId,
  onCheckin,
  eventId,
  onClose,
}: Props) {
  const [search, setSearch] = useState("");

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const filtered = useMemo(() => {
    if (!attendees) return [];
    if (!search.trim()) return attendees;
    const q = search.toLowerCase();
    return attendees.filter(
      (a) =>
        a.userName?.toLowerCase().includes(q) ||
        a.userEmail?.toLowerCase().includes(q) ||
        a.confirmationCode?.toLowerCase().includes(q),
    );
  }, [attendees, search]);

  const checkedInCount = attendees?.filter((a) => a.checkedIn).length ?? 0;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-8 pb-8 overflow-y-auto">
      <div className="fixed inset-0 bg-black/70 backdrop-blur-xl" onClick={onClose} />

      <div className="relative z-10 w-full max-w-2xl mx-4 glass-heavy rounded-3xl animate-fade-in shadow-2xl flex flex-col" style={{ maxHeight: "calc(100vh - 4rem)" }}>
        {/* Header */}
        <div className="p-6 pb-4 border-b border-white/10 shrink-0">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 mb-1">Attendees</h2>
              <p className="text-sm text-slate-500 truncate max-w-sm">{eventTitle}</p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full glass-subtle flex items-center justify-center text-slate-500 hover:text-slate-700 transition-colors cursor-pointer shrink-0"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Stats + Search */}
          <div className="flex items-center gap-3 mt-4">
            <div className="flex gap-2 shrink-0">
              <span className="badge badge-success">{attendees?.length ?? 0} total</span>
              <span className="badge badge-info">{checkedInCount} checked in</span>
            </div>
            <div className="relative flex-1">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, email, or code..."
                className="w-full input-glass rounded-xl pl-9 pr-4 py-2 text-sm"
                autoFocus
              />
            </div>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4">
          {!attendees ? (
            <div className="text-center py-12 text-slate-400 text-sm">Loading attendees...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-400 text-sm">
                {search ? "No attendees match your search." : "No attendees yet."}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((att) => (
                <div
                  key={att.ticketId}
                  className="flex items-center gap-3 p-3 rounded-xl glass-subtle hover:bg-white/40 dark:hover:bg-white/5 transition-colors"
                >
                  {/* Avatar */}
                  <div className="w-9 h-9 rounded-full bg-brand-glow flex items-center justify-center text-[#1a4f3b] text-sm font-bold shrink-0">
                    {att.userName?.charAt(0).toUpperCase()}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-slate-800 truncate">
                        {att.userName}
                      </span>
                      {att.checkedIn && (
                        <svg className="w-4 h-4 text-emerald-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span className="truncate">{att.userEmail}</span>
                      <span className="font-mono text-[#1a4f3b] dark:text-emerald-400 font-bold shrink-0">
                        {att.confirmationCode}
                      </span>
                    </div>
                  </div>

                  {/* Action */}
                  {!att.checkedIn && (
                    <button
                      disabled={checkingInTicketId === att.ticketId}
                      onClick={() => onCheckin(att.ticketId, eventId)}
                      className="cursor-pointer rounded-full bg-accent px-3 py-1.5 text-xs font-semibold text-white hover:bg-accent-dark shadow-sm transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed shrink-0 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border dark:border-emerald-500/30 dark:hover:bg-emerald-500/30"
                    >
                      {checkingInTicketId === att.ticketId ? (
                        <span className="flex items-center gap-1.5">
                          <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          ...
                        </span>
                      ) : (
                        "Check In"
                      )}
                    </button>
                  )}
                  {att.checkedIn && (
                    <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 shrink-0">
                      Checked in
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

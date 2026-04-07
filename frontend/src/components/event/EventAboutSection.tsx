/**
 * EventAboutSection - Description, highlight cards (price + capacity), and category badges.
 *
 * Renders the "About the Event" block with an editable description, a two-column
 * grid of price and capacity stat cards, and the category tag list.
 */
import type { EventDetail } from "../../lib/api";
import EditableField from "./EditableField";
import { formatPrice } from "./utils";

/** Props for EventAboutSection. */
export interface EventAboutSectionProps {
  /** The full event detail object. */
  event: EventDetail;
  /** Whether inline editing mode is active. */
  editMode: boolean;
  /** Callback to refetch the event after an inline edit. */
  fetchEvent: () => void;
  /** Number of spots already sold. */
  spotsUsed: number;
}

/**
 * Renders the description, price/capacity highlight cards, and categories.
 */
export default function EventAboutSection({
  event,
  editMode,
  fetchEvent,
  spotsUsed,
}: EventAboutSectionProps) {
  return (
    <>
      {/* About the Event -- bare, no glass block */}
      <div className="px-1 animate-fade-in stagger-2">
        <h2 className="text-2xl font-bold text-slate-800 tracking-tight mb-4">
          About the Event
        </h2>
        {event.description ? (
          <EditableField
            value={event.description}
            fieldName="description"
            eventId={event.id}
            canEdit={editMode}
            onSaved={fetchEvent}
            type="textarea"
            className="text-slate-500 leading-relaxed whitespace-pre-wrap text-base"
          />
        ) : editMode ? (
          <EditableField
            value=""
            fieldName="description"
            eventId={event.id}
            canEdit={editMode}
            onSaved={fetchEvent}
            type="textarea"
            displayValue="Click to add a description..."
            className="text-slate-300 italic"
          />
        ) : (
          <p className="text-slate-400 italic">No description provided.</p>
        )}
      </div>

      {/* Highlight cards: Price + Capacity */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fade-in stagger-3">
        {/* Price Card */}
        <div className="glass-subtle rounded-2xl p-5 flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-brand-glow flex items-center justify-center shrink-0">
            <svg
              className="w-5 h-5 text-[#1a4f3b]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div>
            <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1">
              Ticket Price
            </div>
            <EditableField
              value={event.ticketPrice}
              fieldName="ticketPrice"
              eventId={event.id}
              canEdit={editMode}
              onSaved={fetchEvent}
              type="number"
              displayValue={formatPrice(event.ticketPrice)}
              className="text-xl font-extrabold text-[#1a4f3b]"
              inputClassName="text-lg font-bold"
            />
          </div>
        </div>

        {/* Capacity Card */}
        <div className="glass-subtle rounded-2xl p-5 flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-brand-glow flex items-center justify-center shrink-0">
            <svg
              className="w-5 h-5 text-[#1a4f3b]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
          </div>
          <div>
            <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1">
              Capacity
            </div>
            <div className="text-xl font-extrabold text-slate-800">
              {spotsUsed}{" "}
              <span className="text-sm font-medium text-slate-400">
                / {event.capacity}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Categories -- bare, no glass block */}
      {event.categories.length > 0 && (
        <div className="px-1 animate-fade-in stagger-4">
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
            Categories
          </h2>
          <div className="flex flex-wrap gap-2">
            {event.categories.map((cat) => (
              <span
                key={cat.id}
                className="rounded-md bg-brand-glow text-[#1a4f3b] border border-brand-light px-3 py-1 text-xs font-bold uppercase tracking-wider"
              >
                {cat.name}
              </span>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

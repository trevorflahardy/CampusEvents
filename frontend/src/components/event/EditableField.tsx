/**
 * EditableField - An inline-editable text/number/datetime field.
 *
 * When `canEdit` is true, clicking the field enters edit mode with an input or textarea.
 * Saves changes on blur or Enter; reverts on Escape or API failure.
 * When `canEdit` is false, renders as a plain display span.
 *
 * @example
 * <EditableField
 *   value={event.title}
 *   fieldName="title"
 *   eventId={event.id}
 *   canEdit={isEditing}
 *   onSaved={refetchEvent}
 * />
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { api } from "../../lib/api";
import { toDatetimeLocal } from "./utils";

/** Props for the EditableField component. */
export interface EditableFieldProps {
  /** The current value of the field. */
  value: string;
  /** The API field name to patch (e.g. "title", "description", "ticketPrice"). */
  fieldName: string;
  /** The event ID for the PATCH request. */
  eventId: number;
  /** Whether inline editing is enabled. */
  canEdit: boolean;
  /** Callback fired after a successful save, typically to refetch the event. */
  onSaved: () => void;
  /** Input type — controls rendering and value serialization. */
  type?: "text" | "textarea" | "number" | "datetime-local";
  /** Optional display text shown instead of the raw value. */
  displayValue?: string;
  /** Additional CSS classes for the display span. */
  className?: string;
  /** Additional CSS classes for the input element. */
  inputClassName?: string;
}

/**
 * Renders a field that can be clicked to edit inline, with automatic save on blur.
 */
export default function EditableField({
  value,
  fieldName,
  eventId,
  canEdit,
  onSaved,
  type = "text",
  displayValue,
  className = "",
  inputClassName = "",
}: EditableFieldProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      if (type !== "datetime-local" && "select" in inputRef.current) {
        inputRef.current.select();
      }
    }
  }, [editing, type]);

  /** Persists the draft value via the API, or reverts on failure. */
  const save = useCallback(async () => {
    const trimmed = draft.trim();
    if (trimmed === value) {
      setEditing(false);
      return;
    }
    setSaving(true);
    try {
      let payload: Record<string, unknown>;
      if (type === "number") {
        payload = { [fieldName]: parseFloat(trimmed) };
      } else if (type === "datetime-local") {
        payload = { [fieldName]: new Date(trimmed).toISOString() };
      } else {
        payload = { [fieldName]: trimmed };
      }
      await api.updateEvent(eventId, payload);
      onSaved();
      setEditing(false);
    } catch {
      // revert on failure
      setDraft(value);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }, [draft, value, fieldName, eventId, type, onSaved]);

  /** Reverts draft to the original value and exits editing mode. */
  const cancel = () => {
    setDraft(value);
    setEditing(false);
  };

  /** Handles keyboard shortcuts: Enter to save, Escape to cancel. */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && type !== "textarea") {
      e.preventDefault();
      save();
    }
    if (e.key === "Escape") {
      cancel();
    }
  };

  if (!canEdit) {
    return <span className={className}>{displayValue ?? value}</span>;
  }

  if (editing) {
    const baseInput =
      "w-full rounded-lg border border-[#2b5c50]/30 bg-white px-3 py-1.5 text-sm text-slate-800 outline-none ring-2 ring-accent/20 focus:ring-[#1a4f3b]/40 transition-shadow " +
      inputClassName;

    if (type === "textarea") {
      return (
        <textarea
          ref={inputRef as React.RefObject<HTMLTextAreaElement>}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={save}
          onKeyDown={handleKeyDown}
          rows={4}
          disabled={saving}
          className={baseInput + " resize-y"}
        />
      );
    }

    return (
      <input
        ref={inputRef as React.RefObject<HTMLInputElement>}
        type={type}
        value={type === "datetime-local" ? toDatetimeLocal(draft) : draft}
        onChange={(e) =>
          setDraft(
            type === "datetime-local"
              ? new Date(e.target.value).toISOString()
              : e.target.value,
          )
        }
        onBlur={save}
        onKeyDown={handleKeyDown}
        disabled={saving}
        className={baseInput}
      />
    );
  }

  return (
    <span
      onClick={() => setEditing(true)}
      className={`group/edit cursor-pointer inline-flex items-center gap-1.5 rounded-md transition-colors hover:bg-brand-glow px-1 -mx-1 ${className}`}
      title="Click to edit"
    >
      {displayValue ?? value}
      <svg
        className="w-3.5 h-3.5 text-accent opacity-0 group-hover/edit:opacity-100 transition-opacity shrink-0"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
        />
      </svg>
    </span>
  );
}

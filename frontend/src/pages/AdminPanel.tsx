import { useState, useEffect, type FormEvent } from "react";
import {
  api,
  ApiError,
  type User,
  type Event,
  type Category,
  type PopularCategory,
} from "../lib/api";

const statusColors: Record<string, string> = {
  upcoming: "badge-success",
  ongoing: "badge-info",
  completed: "badge-neutral",
  cancelled: "badge-danger",
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

type Tab = "users" | "events" | "categories";

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState<Tab>("users");
  const [users, setUsers] = useState<User[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [popularCategories, setPopularCategories] = useState<PopularCategory[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [newCategoryName, setNewCategoryName] = useState("");
  const [categoryError, setCategoryError] = useState("");
  const [cancellingEventId, setCancellingEventId] = useState<number | null>(
    null,
  );
  const [changingRoleUserId, setChangingRoleUserId] = useState<number | null>(
    null,
  );
  const [addingCategory, setAddingCategory] = useState(false);
  const [userSearch, setUserSearch] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [u, e, c, pc] = await Promise.all([
        api.getUsers(),
        api.getEvents(),
        api.getCategories(),
        api.getPopularCategories(),
      ]);
      setUsers(u);
      setEvents(e);
      setCategories(c);
      setPopularCategories(pc);
    } catch {
      setError("Failed to load data.");
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: number, newRole: string) => {
    setChangingRoleUserId(userId);
    try {
      await api.updateUserRole(userId, newRole);
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId
            ? { ...u, role: newRole as "admin" | "organizer" | "student" }
            : u,
        ),
      );
    } catch {
      setError("Failed to update role.");
    } finally {
      setChangingRoleUserId(null);
    }
  };

  const handleAddCategory = async (e: FormEvent) => {
    e.preventDefault();
    setCategoryError("");
    if (!newCategoryName.trim()) return;
    setAddingCategory(true);
    try {
      const cat = await api.createCategory(newCategoryName.trim());
      setCategories((prev) => [...prev, cat]);
      setNewCategoryName("");
    } catch (err) {
      if (err instanceof ApiError) setCategoryError(err.message);
      else setCategoryError("Failed to add category.");
    } finally {
      setAddingCategory(false);
    }
  };

  const filteredUsers = users.filter((u) =>
    u.name.toLowerCase().includes(userSearch.toLowerCase()),
  );

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: "users", label: "Users", count: users.length },
    { key: "events", label: "Events", count: events.length },
    { key: "categories", label: "Categories", count: categories.length },
  ];

  if (loading) {
    return (
      <div className="animate-fade-in">
        <div className="skeleton h-8 w-40 mb-8" />
        <div className="flex gap-2 mb-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-10 w-28 rounded-xl" />
          ))}
        </div>
        <div className="glass-heavy rounded-2xl p-6">
          <div className="skeleton h-5 w-full mb-3" />
          <div className="skeleton h-5 w-full mb-3" />
          <div className="skeleton h-5 w-3/4" />
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <h1 className="text-3xl font-bold tracking-tight mb-8">
        <span className="text-gradient">Admin Panel</span>
      </h1>

      {error && (
        <div
          role="alert"
          className="glass-heavy rounded-2xl p-4 mb-6 border-l-4 border-red-400"
        >
          <p className="text-red-600 text-sm font-medium">{error}</p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-8">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`cursor-pointer flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 ${
              activeTab === tab.key
                ? "btn-primary shadow-sm"
                : "glass-subtle text-slate-600 hover:bg-white/70"
            }`}
          >
            {tab.label}
            <span
              className={`rounded-full px-2 py-0.5 text-xs ${
                activeTab === tab.key
                  ? "bg-white/20 text-white"
                  : "bg-slate-100 text-slate-400"
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Users */}
      {activeTab === "users" && (
        <div className="glass-heavy rounded-2xl overflow-hidden">
          {/* Search bar */}
          <div className="px-6 pt-5 pb-3">
            <div className="relative">
              <svg
                className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Search users by name..."
                className="w-full input-modern rounded-xl pl-10 pr-4 py-2.5 text-sm"
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-white/40">
                <tr className="text-left text-slate-400 border-b border-slate-200/60">
                  <th className="px-6 py-4 font-medium text-xs uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-4 font-medium text-xs uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-4 font-medium text-xs uppercase tracking-wider">
                    NetID
                  </th>
                  <th className="px-6 py-4 font-medium text-xs uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-4 font-medium text-xs uppercase tracking-wider">
                    Created
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/40">
                {filteredUsers.map((u) => (
                    <tr
                      key={u.id}
                      className="hover:bg-white/40 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-linear-to-br from-accent-dark via-accent to-accent-light flex items-center justify-center text-white text-xs font-semibold shrink-0">
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium text-slate-900">
                            {u.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-500">{u.email}</td>
                      <td className="px-6 py-4 font-mono text-slate-500 text-xs">
                        {u.netId}
                      </td>
                      <td className="px-6 py-4">
                        <select
                          value={u.role}
                          disabled={changingRoleUserId === u.id}
                          onChange={(e) =>
                            handleRoleChange(u.id, e.target.value)
                          }
                          className="cursor-pointer input-modern rounded-lg px-3 py-1.5 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <option value="student">student</option>
                          <option value="organizer">organizer</option>
                          <option value="admin">admin</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 text-slate-400 text-xs">
                        {formatDate(u.createdAt)}
                      </td>
                    </tr>
                  ))}
                {filteredUsers.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-10 text-center text-slate-400 text-sm"
                    >
                      No users matching "{userSearch}"
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Events */}
      {activeTab === "events" && (
        <div className="glass-heavy rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-white/40">
                <tr className="text-left text-slate-400 border-b border-slate-200/60">
                  <th className="px-6 py-4 font-medium text-xs uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-6 py-4 font-medium text-xs uppercase tracking-wider">
                    Organizer
                  </th>
                  <th className="px-6 py-4 font-medium text-xs uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-4 font-medium text-xs uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 font-medium text-xs uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/40">
                {events.map((e) => (
                  <tr
                    key={e.id}
                    className="hover:bg-white/40 transition-colors"
                  >
                    <td className="px-6 py-4 text-slate-900 font-medium">
                      {e.title}
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {e.organizerName}
                    </td>
                    <td className="px-6 py-4 text-slate-400 text-xs">
                      {formatDate(e.startTime)}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`badge ${statusColors[e.status] || "badge-neutral"}`}
                      >
                        {e.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {e.status !== "cancelled" ? (
                        <button
                          disabled={cancellingEventId === e.id}
                          onClick={async () => {
                            if (!confirm("Cancel this event?")) return;
                            setCancellingEventId(e.id);
                            try {
                              await api.updateEvent(e.id, {
                                status: "cancelled",
                              });
                              setEvents((prev) =>
                                prev.map((ev) =>
                                  ev.id === e.id
                                    ? {
                                        ...ev,
                                        status: "cancelled",
                                      }
                                    : ev,
                                ),
                              );
                            } catch {
                              setError("Failed to cancel event.");
                            } finally {
                              setCancellingEventId(null);
                            }
                          }}
                          className="cursor-pointer btn-danger rounded-full px-3 py-1.5 text-sm font-semibold transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {cancellingEventId === e.id ? (
                            <span className="flex items-center gap-1.5">
                              <span className="w-3.5 h-3.5 border-2 border-red-300 border-t-red-600 rounded-full animate-spin" />
                              Cancelling...
                            </span>
                          ) : (
                            "Cancel"
                          )}
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400 font-medium">
                          No actions
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Categories */}
      {activeTab === "categories" && (
        <div className="space-y-6">
          <div className="glass-heavy rounded-2xl p-6">
            <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">
              Add Category
            </h2>
            {categoryError && (
              <div
                role="alert"
                className="bg-red-50/80 border border-red-200/60 text-red-600 rounded-xl p-3 mb-4 text-sm font-medium"
              >
                {categoryError}
              </div>
            )}
            <form onSubmit={handleAddCategory} className="flex gap-3">
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Category name"
                required
                className="flex-1 input-modern rounded-lg px-4 py-2.5 text-sm"
              />
              <button
                type="submit"
                disabled={addingCategory}
                className="cursor-pointer btn-primary text-white font-bold px-6 py-2.5 rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {addingCategory ? (
                  <span className="flex items-center gap-1.5">
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Adding...
                  </span>
                ) : (
                  "Add"
                )}
              </button>
            </form>
          </div>

          <div className="glass rounded-2xl p-6">
            <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">
              All Categories
            </h2>
            {categories.length === 0 ? (
              <p className="text-slate-400 text-sm">No categories yet.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <span
                    key={cat.id}
                    className="rounded-full bg-brand-glow text-[#1a4f3b] border border-brand-light px-4 py-1.5 text-sm font-medium"
                  >
                    {cat.name}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="glass rounded-2xl p-6">
            <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">
              Popular Categories
            </h2>
            {popularCategories.length === 0 ? (
              <p className="text-slate-400 text-sm">No data yet.</p>
            ) : (
              <div className="space-y-3">
                {popularCategories.map((pc) => (
                  <div
                    key={pc.categoryId}
                    className="flex items-center justify-between py-3 border-b border-slate-100/60 last:border-0"
                  >
                    <span className="text-slate-900 font-medium">
                      {pc.name}
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-accent-dark via-accent to-accent-light rounded-full"
                          style={{
                            width: `${Math.min((pc.eventCount / Math.max(...popularCategories.map((p) => p.eventCount))) * 100, 100)}%`,
                          }}
                        />
                      </div>
                      <span className="text-sm text-slate-400 font-medium tabular-nums w-12 text-right">
                        {pc.eventCount}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

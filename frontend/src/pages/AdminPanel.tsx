import { useState, useEffect, type FormEvent } from "react";
import { api, ApiError, type User, type Event, type Category, type PopularCategory } from "../lib/api";

const statusColors: Record<string, string> = {
  upcoming: "bg-emerald-500/10 text-emerald-600",
  ongoing: "bg-blue-500/10 text-blue-600",
  completed: "bg-slate-500/10 text-slate-500",
  cancelled: "bg-red-500/10 text-red-500",
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

type Tab = "users" | "events" | "categories";

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState<Tab>("users");
  const [users, setUsers] = useState<User[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [popularCategories, setPopularCategories] = useState<PopularCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [newCategoryName, setNewCategoryName] = useState("");
  const [categoryError, setCategoryError] = useState("");

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [u, e, c, pc] = await Promise.all([
        api.getUsers(), api.getEvents(), api.getCategories(), api.getPopularCategories(),
      ]);
      setUsers(u); setEvents(e); setCategories(c); setPopularCategories(pc);
    } catch {
      setError("Failed to load data.");
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: number, newRole: string) => {
    try {
      await api.updateUserRole(userId, newRole);
      setUsers((prev) => prev.map((u) =>
        u.id === userId ? { ...u, role: newRole as "admin" | "organizer" | "student" } : u
      ));
    } catch {
      setError("Failed to update role.");
    }
  };

  const handleCancelEvent = async (eventId: number) => {
    if (!confirm("Cancel this event?")) return;
    try {
      await api.updateEvent(eventId, { status: "cancelled" });
      setEvents((prev) => prev.map((e) => e.id === eventId ? { ...e, status: "cancelled" as const } : e));
    } catch {
      setError("Failed to cancel event.");
    }
  };

  const handleAddCategory = async (e: FormEvent) => {
    e.preventDefault();
    setCategoryError("");
    if (!newCategoryName.trim()) return;
    try {
      const cat = await api.createCategory(newCategoryName.trim());
      setCategories((prev) => [...prev, cat]);
      setNewCategoryName("");
    } catch (err) {
      if (err instanceof ApiError) setCategoryError(err.message);
      else setCategoryError("Failed to add category.");
    }
  };

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
          {[1, 2, 3].map((i) => <div key={i} className="skeleton h-10 w-28 rounded-xl" />)}
        </div>
        <div className="glass rounded-2xl p-6">
          <div className="skeleton h-5 w-full mb-3" />
          <div className="skeleton h-5 w-full mb-3" />
          <div className="skeleton h-5 w-3/4" />
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-8">Admin Panel</h1>

      {error && (
        <div className="glass rounded-2xl p-4 mb-6 border-l-4 border-red-400">
          <p className="text-red-600 text-sm font-medium">{error}</p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-8">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`cursor-pointer flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
              activeTab === tab.key
                ? "btn-primary text-white"
                : "glass text-slate-500 hover:text-slate-700 hover:bg-white/80"
            }`}
          >
            {tab.label}
            <span className={`rounded-full px-2 py-0.5 text-xs ${
              activeTab === tab.key ? "bg-white/20 text-white" : "bg-slate-100 text-slate-400"
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Users */}
      {activeTab === "users" && (
        <div className="glass rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-400 border-b border-slate-200/60">
                  <th className="px-6 py-4 font-medium text-xs uppercase tracking-wider">Name</th>
                  <th className="px-6 py-4 font-medium text-xs uppercase tracking-wider">Email</th>
                  <th className="px-6 py-4 font-medium text-xs uppercase tracking-wider">NetID</th>
                  <th className="px-6 py-4 font-medium text-xs uppercase tracking-wider">Role</th>
                  <th className="px-6 py-4 font-medium text-xs uppercase tracking-wider">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/60">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-white/40 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 via-violet-500 to-pink-500 flex items-center justify-center text-white text-xs font-semibold shrink-0">
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-slate-900">{u.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-500">{u.email}</td>
                    <td className="px-6 py-4 font-mono text-slate-500 text-xs">{u.netId}</td>
                    <td className="px-6 py-4">
                      <select
                        value={u.role}
                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                        className="cursor-pointer input-glass rounded-lg px-3 py-1.5 text-sm font-medium"
                      >
                        <option value="student">student</option>
                        <option value="organizer">organizer</option>
                        <option value="admin">admin</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 text-slate-400 text-xs">{formatDate(u.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Events */}
      {activeTab === "events" && (
        <div className="glass rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-400 border-b border-slate-200/60">
                  <th className="px-6 py-4 font-medium text-xs uppercase tracking-wider">Title</th>
                  <th className="px-6 py-4 font-medium text-xs uppercase tracking-wider">Organizer</th>
                  <th className="px-6 py-4 font-medium text-xs uppercase tracking-wider">Date</th>
                  <th className="px-6 py-4 font-medium text-xs uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 font-medium text-xs uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/60">
                {events.map((e) => (
                  <tr key={e.id} className="hover:bg-white/40 transition-colors">
                    <td className="px-6 py-4 text-slate-900 font-medium">{e.title}</td>
                    <td className="px-6 py-4 text-slate-500">{e.organizerName}</td>
                    <td className="px-6 py-4 text-slate-400 text-xs">{formatDate(e.startTime)}</td>
                    <td className="px-6 py-4">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusColors[e.status]}`}>
                        {e.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {e.status !== "cancelled" && (
                        <button
                          onClick={() => handleCancelEvent(e.id)}
                          className="cursor-pointer rounded-lg bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-500 hover:bg-red-500/15 transition-colors"
                        >
                          Cancel
                        </button>
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
            <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">Add Category</h2>
            {categoryError && (
              <div className="bg-red-50/80 border border-red-200/60 text-red-600 rounded-xl p-3 mb-4 text-sm font-medium">
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
                className="flex-1 input-glass rounded-xl px-4 py-2.5 text-sm"
              />
              <button
                type="submit"
                className="cursor-pointer btn-primary text-white font-bold px-6 py-2.5 rounded-xl"
              >
                Add
              </button>
            </form>
          </div>

          <div className="glass rounded-2xl p-6">
            <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">All Categories</h2>
            {categories.length === 0 ? (
              <p className="text-slate-400 text-sm">No categories yet.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <span key={cat.id} className="rounded-full bg-indigo-500/8 text-indigo-600 border border-indigo-500/15 px-4 py-1.5 text-sm font-medium">
                    {cat.name}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="glass rounded-2xl p-6">
            <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">Popular Categories</h2>
            {popularCategories.length === 0 ? (
              <p className="text-slate-400 text-sm">No data yet.</p>
            ) : (
              <div className="space-y-3">
                {popularCategories.map((pc) => (
                  <div key={pc.categoryId} className="flex items-center justify-between py-3 border-b border-slate-100/60 last:border-0">
                    <span className="text-slate-900 font-medium">{pc.name}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-indigo-500 via-violet-500 to-pink-500 rounded-full"
                          style={{ width: `${Math.min((pc.eventCount / Math.max(...popularCategories.map(p => p.eventCount))) * 100, 100)}%` }}
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

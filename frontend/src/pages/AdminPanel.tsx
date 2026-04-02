import { useState, useEffect, type FormEvent } from "react";
import {
  api,
  ApiError,
  type User,
  type Event,
  type Category,
  type PopularCategory,
} from "../lib/api";

const statusClasses: Record<string, string> = {
  upcoming: "bg-green-100 text-green-800",
  ongoing: "bg-blue-100 text-blue-800",
  completed: "bg-gray-100 text-gray-800",
  cancelled: "bg-red-100 text-red-800",
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
  const [popularCategories, setPopularCategories] = useState<
    PopularCategory[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // New category form
  const [newCategoryName, setNewCategoryName] = useState("");
  const [categoryError, setCategoryError] = useState("");

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
    }
  };

  const handleCancelEvent = async (eventId: number) => {
    if (!confirm("Cancel this event?")) return;
    try {
      await api.updateEvent(eventId, { status: "cancelled" });
      setEvents((prev) =>
        prev.map((e) =>
          e.id === eventId ? { ...e, status: "cancelled" as const } : e,
        ),
      );
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
      if (err instanceof ApiError) {
        setCategoryError(err.message);
      } else {
        setCategoryError("Failed to add category.");
      }
    }
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: "users", label: "Users" },
    { key: "events", label: "Events" },
    { key: "categories", label: "Categories" },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-gray-500">Loading admin panel...</div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Admin Panel</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 mb-6">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.key
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Users Tab */}
      {activeTab === "users" && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr className="text-left text-gray-500">
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">NetID</th>
                  <th className="px-4 py-3 font-medium">Role</th>
                  <th className="px-4 py-3 font-medium">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((u) => (
                  <tr key={u.id}>
                    <td className="px-4 py-3 text-gray-900 font-medium">
                      {u.name}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{u.email}</td>
                    <td className="px-4 py-3 text-gray-600 font-mono">
                      {u.netId}
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={u.role}
                        onChange={(e) =>
                          handleRoleChange(u.id, e.target.value)
                        }
                        className="rounded border border-gray-300 px-2 py-1 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                      >
                        <option value="student">student</option>
                        <option value="organizer">organizer</option>
                        <option value="admin">admin</option>
                      </select>
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {formatDate(u.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Events Tab */}
      {activeTab === "events" && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr className="text-left text-gray-500">
                  <th className="px-4 py-3 font-medium">Title</th>
                  <th className="px-4 py-3 font-medium">Organizer</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {events.map((e) => (
                  <tr key={e.id}>
                    <td className="px-4 py-3 text-gray-900 font-medium">
                      {e.title}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {e.organizerName}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {formatDate(e.startTime)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusClasses[e.status]}`}
                      >
                        {e.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {e.status !== "cancelled" && (
                        <button
                          onClick={() => handleCancelEvent(e.id)}
                          className="rounded bg-red-600 px-3 py-1 text-xs font-medium text-white hover:bg-red-700"
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

      {/* Categories Tab */}
      {activeTab === "categories" && (
        <div className="space-y-6">
          {/* Add Category */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">
              Add Category
            </h2>
            {categoryError && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 mb-3 text-sm">
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
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              />
              <button
                type="submit"
                className="rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700"
              >
                Add
              </button>
            </form>
          </div>

          {/* All Categories */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">
              All Categories
            </h2>
            {categories.length === 0 ? (
              <p className="text-gray-500 text-sm">No categories yet.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <span
                    key={cat.id}
                    className="rounded-full bg-indigo-50 text-indigo-700 px-3 py-1.5 text-sm font-medium"
                  >
                    {cat.name}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Popular Categories */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">
              Popular Categories
            </h2>
            {popularCategories.length === 0 ? (
              <p className="text-gray-500 text-sm">No data yet.</p>
            ) : (
              <div className="space-y-2">
                {popularCategories.map((pc) => (
                  <div
                    key={pc.categoryId}
                    className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                  >
                    <span className="text-gray-900 font-medium">
                      {pc.name}
                    </span>
                    <span className="text-sm text-gray-500">
                      {pc.eventCount} event{pc.eventCount !== 1 ? "s" : ""}
                    </span>
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

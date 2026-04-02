import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const roleBadgeClasses: Record<string, string> = {
  admin: "bg-purple-100 text-purple-800",
  organizer: "bg-blue-100 text-blue-800",
  student: "bg-green-100 text-green-800",
};

export default function Navbar() {
  const { user, isAuthenticated, isOrganizer, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const navLinks = (
    <>
      <Link
        to="/"
        className="text-gray-700 hover:text-indigo-600 font-medium"
        onClick={() => setMobileOpen(false)}
      >
        Browse Events
      </Link>
      {isAuthenticated && (
        <Link
          to="/my-tickets"
          className="text-gray-700 hover:text-indigo-600 font-medium"
          onClick={() => setMobileOpen(false)}
        >
          My Tickets
        </Link>
      )}
      {isOrganizer && (
        <Link
          to="/dashboard"
          className="text-gray-700 hover:text-indigo-600 font-medium"
          onClick={() => setMobileOpen(false)}
        >
          Dashboard
        </Link>
      )}
      {isAdmin && (
        <Link
          to="/admin"
          className="text-gray-700 hover:text-indigo-600 font-medium"
          onClick={() => setMobileOpen(false)}
        >
          Admin
        </Link>
      )}
    </>
  );

  const authSection = isAuthenticated ? (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-700 font-medium">{user?.name}</span>
      <span
        className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${roleBadgeClasses[user?.role || "student"]}`}
      >
        {user?.role}
      </span>
      <button
        onClick={handleLogout}
        className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 hover:bg-gray-50"
      >
        Logout
      </button>
    </div>
  ) : (
    <div className="flex items-center gap-2">
      <Link
        to="/login"
        className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 hover:bg-gray-50"
        onClick={() => setMobileOpen(false)}
      >
        Login
      </Link>
      <Link
        to="/register"
        className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        onClick={() => setMobileOpen(false)}
      >
        Register
      </Link>
    </div>
  );

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <Link to="/" className="text-xl font-bold text-indigo-600">
            CampusEvents
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6">
            {navLinks}
          </div>
          <div className="hidden md:flex">{authSection}</div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 text-gray-600 hover:text-gray-900"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {mobileOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden pb-4 flex flex-col gap-3">
            {navLinks}
            <div className="pt-2 border-t border-gray-200">{authSection}</div>
          </div>
        )}
      </div>
    </nav>
  );
}

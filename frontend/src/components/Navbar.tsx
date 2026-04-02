import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const roleBadgeClasses: Record<string, string> = {
  admin: "bg-violet-500/10 text-violet-600 border border-violet-500/20",
  organizer: "bg-blue-500/10 text-blue-600 border border-blue-500/20",
  student: "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20",
};

export default function Navbar() {
  const { user, isAuthenticated, isOrganizer, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const isActive = (path: string) => location.pathname === path;

  const linkClasses = (path: string) =>
    `cursor-pointer text-sm font-medium transition-colors duration-200 ${
      isActive(path)
        ? "text-indigo-500"
        : "text-slate-500 hover:text-slate-900"
    }`;

  const navLinks = (
    <>
      <Link to="/events" className={linkClasses("/events")} onClick={() => setMobileOpen(false)}>
        Events
      </Link>
      {isAuthenticated && (
        <Link to="/my-tickets" className={linkClasses("/my-tickets")} onClick={() => setMobileOpen(false)}>
          My Tickets
        </Link>
      )}
      {isOrganizer && (
        <Link to="/dashboard" className={linkClasses("/dashboard")} onClick={() => setMobileOpen(false)}>
          Dashboard
        </Link>
      )}
      {isAdmin && (
        <Link to="/admin" className={linkClasses("/admin")} onClick={() => setMobileOpen(false)}>
          Admin
        </Link>
      )}
    </>
  );

  const authSection = isAuthenticated ? (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 via-violet-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold shadow-sm shadow-indigo-500/20">
          {user?.name?.charAt(0).toUpperCase()}
        </div>
        <span className="text-sm font-medium text-slate-700 hidden sm:block">{user?.name}</span>
      </div>
      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium hidden sm:inline-flex ${roleBadgeClasses[user?.role || "student"]}`}>
        {user?.role}
      </span>
      <button
        onClick={handleLogout}
        className="cursor-pointer bg-slate-100 hover:bg-slate-200 rounded-xl px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-all duration-200"
      >
        Logout
      </button>
    </div>
  ) : (
    <div className="flex items-center gap-2">
      <Link
        to="/login"
        className="cursor-pointer rounded-xl px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
        onClick={() => setMobileOpen(false)}
      >
        Sign in
      </Link>
      <Link
        to="/register"
        className="cursor-pointer btn-primary rounded-xl px-4 py-2 text-sm font-bold text-white"
        onClick={() => setMobileOpen(false)}
      >
        Get Started
      </Link>
    </div>
  );

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2 cursor-pointer">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 via-violet-500 to-purple-500 flex items-center justify-center shadow-md shadow-indigo-500/20">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <span className="text-lg font-bold text-slate-900">Campus<span className="text-gradient">Events</span></span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            {navLinks}
          </div>

          <div className="hidden md:flex">{authSection}</div>

          <button
            className="cursor-pointer md:hidden p-2 text-slate-500 hover:text-slate-900 transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {mobileOpen && (
          <div className="md:hidden pb-4 flex flex-col gap-4 animate-fade-in">
            <div className="flex flex-col gap-3">
              {navLinks}
            </div>
            <div className="pt-3 border-t border-slate-200/60">
              {authSection}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

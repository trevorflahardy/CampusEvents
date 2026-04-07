import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";

export default function Navbar() {
  const { user, isAuthenticated, isOrganizer, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const isActive = (path: string) => location.pathname === path;

  /* ---- Nav items definition ---- */
  interface NavItem {
    label: string;
    path: string;
    icon: React.ReactNode;
    show: boolean;
  }

  const navItems: NavItem[] = [
    {
      label: "Dashboard",
      path: "/dashboard",
      show: isAuthenticated,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      ),
    },
    {
      label: "My Tickets",
      path: "/my-tickets",
      show: isAuthenticated,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
        </svg>
      ),
    },
    {
      label: "Admin",
      path: "/admin",
      show: isAdmin,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
    },
    {
      label: "Profile",
      path: "/profile",
      show: isAuthenticated,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
    },
  ];

  const visibleItems = navItems.filter((item) => item.show);

  /* ---- Desktop sidebar nav link classes ---- */
  const desktopLinkClasses = (path: string) =>
    `flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors cursor-pointer ${
      isActive(path)
        ? "bg-white/70 shadow-sm text-[#1a4f3b] dark:bg-[#212d28] dark:text-emerald-400 dark:shadow-none"
        : "text-slate-600 hover:bg-white/40 dark:text-[#94a3b8] dark:hover:bg-white/5 dark:hover:text-white"
    }`;

  /* ---- Mobile bottom nav link classes ---- */
  const mobileLinkClasses = (path: string) =>
    `flex flex-col items-center cursor-pointer transition-colors ${
      isActive(path) ? "text-[#1a4f3b] dark:text-emerald-400" : "text-gray-400 dark:text-[#64748b]"
    }`;

  return (
    <>
      {/* ========== Desktop Sidebar ========== */}
      <aside className="hidden md:flex glass w-64 h-screen flex-col pt-8 pb-6 px-4 fixed left-0 top-0 z-40 border-r border-slate-200/60 dark:border-white/20">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2 cursor-pointer px-2 mb-2">
          <div className="w-9 h-9 rounded-xl bg-[#1a4f3b] flex items-center justify-center shadow-md">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <span className="text-lg font-bold text-slate-900 dark:text-white">
            Campus<span className="text-gradient">Events</span>
          </span>
        </Link>

        {/* User Profile */}
        {isAuthenticated && user ? (
          <div className="flex items-center gap-3 mb-8 px-2 mt-3">
            <div className="w-10 h-10 rounded-full bg-[#1a4f3b] flex items-center justify-center text-white text-xs font-bold shadow-sm shrink-0 ring-2 ring-emerald-500/30 dark:ring-emerald-500/50">
              {user.name?.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <h2 className="font-semibold text-sm leading-tight truncate dark:text-white">{user.name}</h2>
              <p className="text-xs text-slate-500 dark:text-[#94a3b8] capitalize">{user.role}</p>
            </div>
          </div>
        ) : (
          <div className="mb-8 mt-3 px-2">
            <p className="text-sm text-slate-500 dark:text-[#94a3b8]">Welcome, Guest</p>
          </div>
        )}

        {/* Navigation Links */}
        <nav className="flex-1 space-y-2">
          {visibleItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={desktopLinkClasses(item.path)}
              aria-current={isActive(item.path) ? "page" : undefined}
            >
              {item.icon}
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Bottom section: Auth */}
        <div className="pt-4 border-t border-white/20 dark:border-white/5 space-y-2 px-2">
          {isAuthenticated ? (
            <button
              onClick={handleLogout}
              className="cursor-pointer flex items-center gap-3 w-full px-2 py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:bg-white/40 hover:text-slate-700 dark:text-[#94a3b8] dark:hover:bg-white/5 dark:hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout
            </button>
          ) : (
            <div className="flex flex-col gap-2">
              <Link
                to="/login"
                className="cursor-pointer flex items-center justify-center px-4 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-white/40 transition-colors"
              >
                Sign in
              </Link>
              <Link
                to="/register"
                className="cursor-pointer btn-primary flex items-center justify-center rounded-full px-4 py-2.5 text-sm font-bold text-white"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      </aside>

      {/* ========== Mobile Top Bar (brand only) ========== */}
      <header className="md:hidden sticky top-0 z-50 glass flex items-center justify-between px-4 h-14 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <Link to="/" className="flex items-center gap-2 cursor-pointer">
          <div className="w-8 h-8 rounded-xl bg-[#1a4f3b] flex items-center justify-center shadow-md">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <span className="text-lg font-bold text-slate-900">
            Campus<span className="text-gradient">Events</span>
          </span>
        </Link>

        {isAuthenticated && user ? (
          <div className="w-8 h-8 rounded-full bg-[#1a4f3b] flex items-center justify-center text-white text-xs font-bold shadow-sm">
            {user.name?.charAt(0).toUpperCase()}
          </div>
        ) : (
          <Link
            to="/login"
            className="cursor-pointer text-sm font-medium text-[#1a4f3b] hover:text-accent-light transition-colors"
          >
            Sign in
          </Link>
        )}
      </header>

      {/* ========== Mobile Bottom Pill Nav ========== */}
      <div className="md:hidden fixed bottom-0 w-full max-w-md left-1/2 -translate-x-1/2 p-4 z-50">
        <nav className="glass-heavy rounded-full flex justify-between items-center px-6 py-3 shadow-lg">
          {visibleItems.slice(0, 5).map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={mobileLinkClasses(item.path)}
              aria-current={isActive(item.path) ? "page" : undefined}
            >
              <span className="[&>svg]:w-6 [&>svg]:h-6">{item.icon}</span>
              <span className="text-xs font-medium mt-0.5">{item.label}</span>
            </Link>
          ))}
        </nav>
      </div>

      {/* Spacer for mobile bottom nav — prevents content hiding behind it */}
      <div className="md:hidden h-20" aria-hidden="true" />
    </>
  );
}

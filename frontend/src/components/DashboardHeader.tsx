import { useAuth } from "../context/useAuth";
import { useTheme } from "../context/ThemeContext";

interface DashboardHeaderProps {
  /** Controlled search value */
  searchQuery?: string;
  /** Called when the search input changes */
  onSearchChange?: (value: string) => void;
  /** Placeholder text for the search bar */
  searchPlaceholder?: string;
  /** Optional actions rendered to the left of the standard icons */
  actions?: React.ReactNode;
}

export default function DashboardHeader({
  searchQuery = "",
  onSearchChange,
  searchPlaceholder = "Search events, venues, or tags...",
  actions,
}: DashboardHeaderProps) {
  const { user } = useAuth();
  const { theme, toggle } = useTheme();

  return (
    <header className="sticky top-0 z-20 px-6 py-4 flex items-center justify-between shrink-0">
      {/* Search bar */}
      <div className="relative w-full max-w-2xl">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <svg
            className="h-5 w-5 text-gray-400"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange?.(e.target.value)}
          placeholder={searchPlaceholder}
          className="glass-subtle w-full pl-11 pr-4 py-3 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-white/50 placeholder-gray-500 transition-shadow"
        />
      </div>

      {/* Right: custom actions + standard icons + avatar */}
      <div className="flex items-center gap-3 ml-4 shrink-0">
        {actions}

        {/* Notification bell */}
        <button
          className="cursor-pointer p-2 rounded-full hover:bg-white/50 dark:hover:bg-white/10 text-gray-500 dark:text-[#94a3b8] transition-colors"
          title="Notifications"
          aria-label="Notifications"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
            />
          </svg>
        </button>

        {/* Settings gear */}
        <button
          className="cursor-pointer p-2 rounded-full hover:bg-white/50 dark:hover:bg-white/10 text-gray-500 dark:text-[#94a3b8] transition-colors"
          title="Settings"
          aria-label="Settings"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        </button>

        {/* Light / Dark mode toggle */}
        <button
          onClick={(e) => toggle(e)}
          className="cursor-pointer p-2 rounded-full hover:bg-white/50 dark:hover:bg-white/10 text-gray-500 dark:text-[#94a3b8] transition-colors"
          title={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
          aria-label={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
        >
          {theme === "light" ? (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          )}
        </button>

        {/* User avatar */}
        {user && (
          <div
            className="w-10 h-10 rounded-full bg-[#1a4f3b] flex items-center justify-center text-white text-sm font-bold shadow-sm border border-white/50 dark:border-emerald-500/50 cursor-pointer"
            title={user.name}
          >
            {user.name?.charAt(0).toUpperCase()}
          </div>
        )}
      </div>
    </header>
  );
}

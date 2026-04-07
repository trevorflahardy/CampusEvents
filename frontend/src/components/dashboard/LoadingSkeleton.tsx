/**
 * LoadingSkeleton renders a placeholder UI while the dashboard data is loading.
 * Shows shimmer placeholders for the header, stat cards, and event cards.
 *
 * @module dashboard/LoadingSkeleton
 */

/**
 * Renders the full-page loading skeleton for the organizer dashboard.
 */
export default function LoadingSkeleton() {
  return (
    <div className="flex flex-col h-screen overflow-hidden animate-fade-in">
      <div className="glass px-6 py-4 shrink-0">
        <div className="skeleton h-12 w-full max-w-2xl rounded-full" />
      </div>
      <div className="flex-1 overflow-y-auto p-8 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass-heavy rounded-3xl p-6">
              <div className="skeleton h-4 w-24 mb-3 rounded-lg" />
              <div className="skeleton h-10 w-16 rounded-lg" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <div key={i} className="glass-heavy rounded-2xl overflow-hidden">
              <div className="skeleton h-32 w-full" />
              <div className="p-4">
                <div className="skeleton h-5 w-2/3 mb-3 rounded-lg" />
                <div className="skeleton h-4 w-1/2 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

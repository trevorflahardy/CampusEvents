/**
 * EventDetailLoading - Skeleton loading state for the event detail page.
 *
 * Displays placeholder shapes that mirror the real layout (hero banner,
 * two-column content grid) while event data is being fetched.
 */

/**
 * Renders the full-page loading skeleton for the EventDetail page.
 */
export default function EventDetailLoading() {
  return (
    <div className="bg-mesh min-h-full animate-fade-in">
      {/* Back link skeleton */}
      <div className="max-w-6xl mx-auto px-4 md:px-8 pt-6">
        <div className="skeleton h-5 w-32 mb-6 rounded-lg" />
      </div>
      {/* Hero skeleton */}
      <div className="relative w-full h-72 md:h-[500px] skeleton rounded-none" />
      {/* Content skeleton */}
      <div className="max-w-6xl mx-auto px-4 md:px-8 mt-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="skeleton h-24 rounded-2xl" />
            <div className="skeleton h-48 rounded-2xl" />
          </div>
          <div className="space-y-6">
            <div className="skeleton h-44 rounded-2xl" />
            <div className="skeleton h-36 rounded-2xl" />
          </div>
        </div>
      </div>
    </div>
  );
}

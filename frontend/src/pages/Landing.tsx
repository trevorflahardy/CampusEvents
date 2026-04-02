import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { api, type EventStat } from "../lib/api";
import { useAuth } from "../context/AuthContext";

export default function Landing() {
  const { isAuthenticated } = useAuth();
  const [stats, setStats] = useState<EventStat[]>([]);

  useEffect(() => {
    api.getEventStats().then(setStats).catch(() => {});
  }, []);

  const totalEvents = stats.length;
  const totalTickets = stats.reduce((sum, s) => sum + s.ticketsSold, 0);
  const totalCapacity = stats.reduce((sum, s) => sum + s.capacity, 0);

  return (
    <div className="relative overflow-hidden">
      {/* Hero */}
      <section className="relative px-4 sm:px-6 pt-32 pb-20 md:pt-44 md:pb-28 bg-hero">
        {/* Animated orbs */}
        <div className="absolute top-16 left-[15%] w-72 h-72 bg-indigo-400/20 rounded-full blur-3xl pointer-events-none animate-float" />
        <div className="absolute top-32 right-[10%] w-96 h-96 bg-pink-400/15 rounded-full blur-3xl pointer-events-none animate-float-slow" />
        <div className="absolute bottom-0 left-[40%] w-80 h-80 bg-cyan-400/10 rounded-full blur-3xl pointer-events-none animate-float-delayed" />

        <div className="max-w-4xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 glass rounded-full px-5 py-2 mb-8 animate-fade-in">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
            <span className="text-sm font-semibold text-slate-600">
              {totalEvents > 0
                ? `${totalEvents} events live now`
                : "Campus events platform"}
            </span>
          </div>

          <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-slate-900 mb-6 animate-fade-in stagger-1 leading-[1.1]">
            Discover what's
            <br />
            <span className="text-gradient">
              happening on campus
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-500 max-w-2xl mx-auto mb-12 leading-relaxed animate-fade-in stagger-2">
            Browse events, book tickets, and never miss out on campus life.
            One platform for students, organizers, and administrators.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in stagger-3">
            <Link
              to="/events"
              className="cursor-pointer inline-flex items-center gap-2.5 btn-primary text-white font-bold px-8 py-4 rounded-2xl text-lg"
            >
              Browse Events
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
            {!isAuthenticated && (
              <Link
                to="/register"
                className="cursor-pointer inline-flex items-center gap-2 glass-heavy font-bold px-8 py-4 rounded-2xl text-slate-700 hover:bg-white/90 transition-all duration-300 text-lg"
              >
                Create Account
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Stats */}
      {totalEvents > 0 && (
        <section className="px-4 sm:px-6 -mt-6 pb-16 relative z-10">
          <div className="max-w-3xl mx-auto">
            <div className="glass-heavy rounded-3xl p-1.5 shadow-lg shadow-indigo-500/5">
              <div className="grid grid-cols-3 divide-x divide-slate-200/50">
                {[
                  { value: totalEvents, label: "Active Events", color: "text-indigo-600" },
                  { value: totalTickets, label: "Tickets Sold", color: "text-violet-600" },
                  { value: totalCapacity, label: "Total Capacity", color: "text-pink-600" },
                ].map((stat, i) => (
                  <div key={i} className="text-center py-7 px-4">
                    <div className={`text-3xl sm:text-4xl font-extrabold ${stat.color}`}>{stat.value}</div>
                    <div className="text-sm text-slate-400 mt-1 font-medium">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Features */}
      <section className="px-4 sm:px-6 pb-28">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4">
              Everything you need
            </h2>
            <p className="text-lg text-slate-400 max-w-xl mx-auto">
              A complete platform for managing campus events from discovery to check-in.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                glass: "glass-blue",
                iconBg: "bg-indigo-500",
                icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />,
                title: "Discover Events",
                desc: "Search by name, filter by category or date range, and find exactly what you're looking for on campus.",
              },
              {
                glass: "glass-violet",
                iconBg: "bg-violet-500",
                icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />,
                title: "Book Instantly",
                desc: "Reserve your spot with one click. Get a confirmation code and track all your bookings in one place.",
              },
              {
                glass: "glass-emerald",
                iconBg: "bg-emerald-500",
                icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />,
                title: "Organize & Manage",
                desc: "Create events, track ticket sales, check in attendees, and manage everything from your dashboard.",
              },
            ].map((feature, i) => (
              <div key={i} className={`${feature.glass} rounded-3xl p-8 hover-lift cursor-default`}>
                <div className={`w-12 h-12 rounded-2xl ${feature.iconBg} flex items-center justify-center mb-5 shadow-lg`}>
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {feature.icon}
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">{feature.title}</h3>
                <p className="text-slate-500 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 sm:px-6 pb-28">
        <div className="max-w-4xl mx-auto">
          <div className="relative rounded-3xl p-12 md:p-16 text-center overflow-hidden" style={{
            background: "linear-gradient(135deg, rgba(99,102,241,0.08) 0%, rgba(168,85,247,0.08) 50%, rgba(236,72,153,0.06) 100%)",
            backdropFilter: "blur(40px)",
            border: "1px solid rgba(139,92,246,0.15)",
          }}>
            <div className="absolute -top-20 -right-20 w-60 h-60 bg-indigo-400/15 rounded-full blur-3xl pointer-events-none animate-float" />
            <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-pink-400/10 rounded-full blur-3xl pointer-events-none animate-float-slow" />

            <div className="relative">
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4">
                Ready to get started?
              </h2>
              <p className="text-lg text-slate-500 mb-10 max-w-lg mx-auto">
                Join CampusEvents today and stay connected with everything happening at your university.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  to="/events"
                  className="cursor-pointer inline-flex items-center gap-2 btn-primary text-white font-bold px-8 py-4 rounded-2xl"
                >
                  Explore Events
                </Link>
                {!isAuthenticated && (
                  <Link
                    to="/register"
                    className="cursor-pointer text-indigo-500 font-bold hover:text-violet-500 transition-colors text-lg"
                  >
                    Sign up free
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-4 sm:px-6 pb-8">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-sm text-slate-400">
            CampusEvents &mdash; COP 4710 Database Design, USF Spring 2026
          </p>
        </div>
      </footer>
    </div>
  );
}

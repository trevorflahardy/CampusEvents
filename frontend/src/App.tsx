import { useRef, useEffect } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import Landing from "./pages/Landing";
import BrowseEvents from "./pages/BrowseEvents";
import EventDetail from "./pages/EventDetail";
import Login from "./pages/Login";
import Register from "./pages/Register";
import MyTickets from "./pages/MyTickets";
import OrganizerDashboard from "./pages/OrganizerDashboard";
import AdminPanel from "./pages/AdminPanel";

/** Routes that render standalone — no sidebar, no offset */
const STANDALONE_ROUTES = ["/", "/login", "/register"];

function AppLayout() {
  const location = useLocation();
  const isStandalone = STANDALONE_ROUTES.includes(location.pathname);
  const mainRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Set page title
    const titles: Record<string, string> = {
      "/": "Home",
      "/events": "Events",
      "/login": "Sign In",
      "/register": "Create Account",
      "/my-tickets": "My Tickets",
      "/dashboard": "Dashboard",
      "/admin": "Admin Panel",
    };
    const base = "CampusEvents";
    const pageTitle = titles[location.pathname] || "Page";
    document.title =
      location.pathname === "/" ? base : `${pageTitle} - ${base}`;

    // Move focus to main content for screen readers
    if (mainRef.current) {
      mainRef.current.focus();
    }
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-mesh">
      {!isStandalone && <Navbar />}
      <div
        ref={mainRef}
        tabIndex={-1}
        className={`outline-none ${isStandalone ? "" : "md:ml-64"}`}
      >
        <Routes>
          {/* Standalone pages — no sidebar */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* App pages — sidebar visible */}
          <Route path="/events" element={<BrowseEvents />} />
          <Route path="/events/:id" element={<EventDetail />} />
          <Route
            path="/my-tickets"
            element={
              <ProtectedRoute>
                <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 pb-16">
                  <MyTickets />
                </main>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <OrganizerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute roles={["admin"]}>
                <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 pb-16">
                  <AdminPanel />
                </main>
              </ProtectedRoute>
            }
          />
        </Routes>
      </div>
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppLayout />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;

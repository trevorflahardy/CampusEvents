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

  return (
    <div className="min-h-screen bg-mesh">
      {!isStandalone && <Navbar />}
      <div className={isStandalone ? "" : "md:ml-64"}>
        <Routes>
          {/* Standalone pages — no sidebar */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* App pages — sidebar visible */}
          <Route path="/events" element={<BrowseEvents />} />
          <Route
            path="/events/:id"
            element={
              <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 pb-16">
                <EventDetail />
              </main>
            }
          />
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
              <ProtectedRoute roles={["organizer", "admin"]}>
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

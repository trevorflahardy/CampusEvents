import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
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

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-mesh">
          <Navbar />
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route
              path="/events"
              element={
                <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 pb-16">
                  <BrowseEvents />
                </main>
              }
            />
            <Route
              path="/events/:id"
              element={
                <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 pb-16">
                  <EventDetail />
                </main>
              }
            />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
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
                  <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 pb-16">
                    <OrganizerDashboard />
                  </main>
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
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;

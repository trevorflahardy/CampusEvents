import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { ApiError } from "../lib/api";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [netId, setNetId] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("student");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    try {
      await register({ netId, name, email, password, role });
      navigate("/events");
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Registration failed. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-12"
      style={{
        background:
          "radial-gradient(circle at 20% 0%, #908276 0%, #5c5d63 40%, #25272c 80%, #1b1c20 100%)",
      }}
    >
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-[#1a4f3b] flex items-center justify-center mx-auto mb-4 shadow-[0_4px_20px_rgba(26,79,59,0.4)]">
            <svg
              className="w-7 h-7 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white">Create account</h1>
          <p className="text-gray-300 mt-1 text-sm">Join CampusEvents today</p>
        </div>

        <div className="glass-heavy rounded-2xl p-8">
          {error && (
            <div role="alert" className="bg-red-50/80 border border-red-200/60 text-red-600 rounded-xl p-3 mb-5 text-sm font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="netId"
                  className="block text-sm font-medium text-slate-700 mb-1.5"
                >
                  NetID
                </label>
                <input
                  id="netId"
                  type="text"
                  required
                  value={netId}
                  onChange={(e) => setNetId(e.target.value)}
                  className="w-full input-glass rounded-xl px-4 py-2.5 text-sm"
                  placeholder="U12345678"
                />
              </div>
              <div>
                <label
                  htmlFor="role"
                  className="block text-sm font-medium text-slate-700 mb-1.5"
                >
                  Role
                </label>
                <select
                  id="role"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="cursor-pointer w-full input-glass rounded-xl px-4 py-2.5 text-sm"
                >
                  <option value="student">Student</option>
                  <option value="organizer">Organizer</option>
                </select>
              </div>
            </div>
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-slate-700 mb-1.5"
              >
                Full Name
              </label>
              <input
                id="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full input-glass rounded-xl px-4 py-2.5 text-sm"
                placeholder="John Doe"
              />
            </div>
            <div>
              <label
                htmlFor="reg-email"
                className="block text-sm font-medium text-slate-700 mb-1.5"
              >
                Email
              </label>
              <input
                id="reg-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full input-glass rounded-xl px-4 py-2.5 text-sm"
                placeholder="you@usf.edu"
              />
            </div>
            <div>
              <label
                htmlFor="reg-password"
                className="block text-sm font-medium text-slate-700 mb-1.5"
              >
                Password
              </label>
              <input
                id="reg-password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full input-glass rounded-xl px-4 py-2.5 text-sm"
                placeholder="Choose a password"
              />
            </div>
            <div>
              <label
                htmlFor="confirm-password"
                className="block text-sm font-medium text-slate-700 mb-1.5"
              >
                Confirm Password
              </label>
              <input
                id="confirm-password"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full input-glass rounded-xl px-4 py-2.5 text-sm"
                placeholder="Repeat your password"
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="cursor-pointer w-full btn-primary text-white font-bold py-3 rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating account...
                </span>
              ) : (
                "Create Account"
              )}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-gray-300">
          Already have an account?{" "}
          <Link
            to="/login"
            className="text-brand-light hover:text-white font-semibold transition-colors"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

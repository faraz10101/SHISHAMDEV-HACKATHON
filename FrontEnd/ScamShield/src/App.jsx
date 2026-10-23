import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginForm from './components/auth/LoginForm';
import RegisterForm from './components/auth/RegisterForm';
import VerifyForm from './components/auth/VerifyForm';
import Navbar from './components/layout/Navbar';
import { GuestRoute, ProtectedRoute, AdminRoute } from './components/common/RouteGuards';
import HomePage from './pages/HomePage';
import CheckPage from './pages/CheckPage';
import ReportPage from './pages/ReportPage';
import LookupPage from './pages/LookupPage';
import AdminDashboardPage from './admin/pages/AdminDashboardPage';
import { getCurrentUser, logoutUser } from './api/auth';
import { AuthContext } from './context/AuthContext';

const PENDING_KEY = 'pendingEmail';

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  // Email waiting for its verification code (kept in sessionStorage so a refresh does not lose it)
  const [pendingEmail, setPendingEmailState] = useState(() => sessionStorage.getItem(PENDING_KEY) || '');

  const setPendingEmail = useCallback((email) => {
    setPendingEmailState(email || '');
    if (email) sessionStorage.setItem(PENDING_KEY, email);
    else sessionStorage.removeItem(PENDING_KEY);
  }, []);

  // Restore the session from the backend (cookie or Bearer token) via GET /api/auth/me
  useEffect(() => {
    getCurrentUser().then((u) => { setUser(u); setLoading(false); });
  }, []);

  const handleLogout = async () => {
    await logoutUser();
    setUser(null);
  };

  const handleAuthenticated = (u) => { setUser(u); setPendingEmail(''); };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="animate-pulse font-semibold text-slate-600">Loading ScamShield...</p>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, setUser, logout: handleLogout, pendingEmail, setPendingEmail }}>
      <BrowserRouter>
        <Navbar user={user} onLogout={handleLogout} />

        <Routes>
          {/* Public */}
          <Route path="/" element={<HomePage />} />
          <Route path="/check" element={<CheckPage />} />
          <Route path="/lookup" element={<LookupPage />} />

          {/* Needs login + verified email */}
          <Route path="/report" element={<ProtectedRoute user={user}><ReportPage /></ProtectedRoute>} />

          {/* Auth */}
          <Route path="/login" element={<GuestRoute user={user}><LoginForm onLoginSuccess={handleAuthenticated} onNeedVerify={setPendingEmail} /></GuestRoute>} />
          <Route path="/register" element={<GuestRoute user={user}><RegisterForm onRegisterSuccess={setPendingEmail} /></GuestRoute>} />
          <Route
            path="/verify"
            element={
              user ? <Navigate to="/" replace />
                : pendingEmail ? <VerifyForm email={pendingEmail} onVerificationSuccess={handleAuthenticated} />
                : <Navigate to="/register" replace />
            }
          />

          {/* AI provider management (also needs the ADMIN_KEY) */}
          <Route path="/admin" element={<AdminRoute user={user}><AdminDashboardPage /></AdminRoute>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthContext.Provider>
  );
}

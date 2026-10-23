import { Navigate, useLocation } from 'react-router-dom';

// Logged-in users are sent away from login/register
export function GuestRoute({ user, children }) {
  return user ? <Navigate to="/" replace /> : children;
}

// Reporting needs a logged-in (email-verified) account. After login the user returns here.
export function ProtectedRoute({ user, children }) {
  const location = useLocation();
  return user ? children : <Navigate to="/login" replace state={{ from: location.pathname }} />;
}

export function AdminRoute({ user, children }) {
  return user?.role === 'admin' ? children : <Navigate to="/" replace />;
}

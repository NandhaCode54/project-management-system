import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FullPageLoader } from '../components/Spinner';

export function PrivateRoute() {
  const { user, initializing } = useAuth();
  const location = useLocation();

  if (initializing) return <FullPageLoader />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;

  return <Outlet />;
}

export function PublicOnlyRoute() {
  const { user, initializing } = useAuth();

  if (initializing) return <FullPageLoader />;
  if (user) return <Navigate to="/dashboard" replace />;

  return <Outlet />;
}
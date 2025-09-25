import { useAuthStore } from '@/stores/auth';
import { Navigate, useLocation } from 'react-router-dom';

interface AuthRouteProps {
  children: JSX.Element;
}

export const AuthRoute = ({ children }: AuthRouteProps) => {
  const { isAuthenticated } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

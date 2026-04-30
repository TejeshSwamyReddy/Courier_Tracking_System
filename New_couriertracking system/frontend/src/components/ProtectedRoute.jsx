import { Navigate, useLocation } from "react-router-dom";
import LoadingScreen from "./LoadingScreen";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = ({ children, role }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingScreen fullscreen label="Checking access..." />;
  }

  if (!user) {
    const nextPath = role === "admin" ? "/admin/login" : "/auth";
    return <Navigate to={nextPath} replace state={{ from: location.pathname }} />;
  }

  if (role && user.role !== role) {
    return <Navigate to={user.role === "admin" ? "/admin" : "/dashboard"} replace />;
  }

  return children;
};

export default ProtectedRoute;


import { Navigate, Route, Routes } from "react-router-dom";
import LoadingScreen from "./components/LoadingScreen";
import ProtectedRoute from "./components/ProtectedRoute";
import { useAuth } from "./context/AuthContext";
import AdminDashboard from "./pages/AdminDashboard";
import AdminLoginPage from "./pages/AdminLoginPage";
import AuthPage from "./pages/AuthPage";
import HomePage from "./pages/HomePage";
import TrackPage from "./pages/TrackPage";
import UserDashboard from "./pages/UserDashboard";

const App = () => {
  const { loading } = useAuth();

  if (loading) {
    return <LoadingScreen label="Warming up your courier workspace..." fullscreen />;
  }

  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/track" element={<TrackPage />} />
      <Route path="/track/:trackingId" element={<TrackPage />} />
      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <UserDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute role="admin">
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;

